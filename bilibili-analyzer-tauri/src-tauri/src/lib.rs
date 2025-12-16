use md5::{Md5, Digest};
use reqwest::header::{HeaderMap, HeaderValue, COOKIE, REFERER, USER_AGENT};
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::Mutex;
use std::io::Write;

// WBI 混淆表 (固定值)
const MIXIN_KEY_ENC_TAB: [usize; 64] = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29,
    28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25,
    54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52,
];

// 数据结构定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoInfo {
    pub title: String,
    pub bvid: String,
    pub aid: i64,
    pub publish_time: String,
    pub duration: String,
    pub play_count: i64,
    pub danmu_count: i64,
    pub comment_count: i64,
    pub favorite_count: i64,
    pub category: String,
    pub description: String,
    pub cover: Option<String>,  // 本地封面路径
    pub video_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpInfo {
    pub name: String,
    pub sign: String,
    pub level: i32,
    pub face: Option<String>,  // 本地头像路径
    pub mid: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrapeProgress {
    pub current: i32,
    pub total: i32,
    pub page: i32,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrapeResult {
    pub up_info: Option<UpInfo>,
    pub videos: Vec<VideoInfo>,
    pub success: bool,
    pub error: Option<String>,
}

// 爬虫状态
pub struct ScraperState {
    pub img_key: Mutex<String>,
    pub sub_key: Mutex<String>,
    pub cookie: Mutex<String>,
    pub is_running: Mutex<bool>,
}

impl Default for ScraperState {
    fn default() -> Self {
        Self {
            img_key: Mutex::new(String::new()),
            sub_key: Mutex::new(String::new()),
            cookie: Mutex::new(String::new()),
            is_running: Mutex::new(false),
        }
    }
}

// 数据库相关函数
fn get_db_path(app_handle: &AppHandle) -> PathBuf {
    let app_data_dir = app_handle.path().app_data_dir().expect("获取应用数据目录失败");
    std::fs::create_dir_all(&app_data_dir).expect("创建应用数据目录失败");
    app_data_dir.join("bilibili_analyzer.db")
}

// 获取图片存储目录
fn get_images_dir(app_handle: &AppHandle) -> PathBuf {
    let app_data_dir = app_handle.path().app_data_dir().expect("获取应用数据目录失败");
    let images_dir = app_data_dir.join("images");
    std::fs::create_dir_all(&images_dir).expect("创建图片目录失败");
    images_dir
}

// 获取头像存储目录
fn get_avatars_dir(app_handle: &AppHandle) -> PathBuf {
    let images_dir = get_images_dir(app_handle);
    let avatars_dir = images_dir.join("avatars");
    std::fs::create_dir_all(&avatars_dir).expect("创建头像目录失败");
    avatars_dir
}

// 获取封面存储目录
fn get_covers_dir(app_handle: &AppHandle) -> PathBuf {
    let images_dir = get_images_dir(app_handle);
    let covers_dir = images_dir.join("covers");
    std::fs::create_dir_all(&covers_dir).expect("创建封面目录失败");
    covers_dir
}

// 从URL中提取文件扩展名
fn get_extension_from_url(url: &str) -> String {
    // 移除查询参数
    let url_without_query = url.split('?').next().unwrap_or(url);
    // 获取扩展名
    if let Some(ext) = url_without_query.rsplit('.').next() {
        let ext_lower = ext.to_lowercase();
        if ["jpg", "jpeg", "png", "gif", "webp"].contains(&ext_lower.as_str()) {
            return ext_lower;
        }
    }
    "jpg".to_string() // 默认扩展名
}

// 下载图片到本地（带重试机制）
async fn download_image(client: &reqwest::Client, url: &str, save_path: &PathBuf) -> Result<(), String> {
    // 如果文件已存在，跳过下载
    if save_path.exists() {
        return Ok(());
    }

    let max_retries = 3;
    let mut last_error = String::new();

    for attempt in 0..max_retries {
        if attempt > 0 {
            // 重试前等待，指数退避
            tokio::time::sleep(tokio::time::Duration::from_millis(500 * (attempt as u64 + 1))).await;
        }

        let resp = match client
            .get(url)
            .header(USER_AGENT, "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
            .header(REFERER, "https://www.bilibili.com")
            .send()
            .await
        {
            Ok(r) => r,
            Err(e) => {
                last_error = format!("请求失败: {}", e);
                continue;
            }
        };

        if !resp.status().is_success() {
            last_error = format!("状态码: {}", resp.status());
            // 5xx 错误可以重试，4xx 错误直接返回
            if resp.status().is_server_error() {
                continue;
            }
            return Err(format!("下载图片失败，{}", last_error));
        }

        let bytes = match resp.bytes().await {
            Ok(b) => b,
            Err(e) => {
                last_error = format!("读取数据失败: {}", e);
                continue;
            }
        };

        let mut file = std::fs::File::create(save_path)
            .map_err(|e| format!("创建图片文件失败: {}", e))?;

        file.write_all(&bytes)
            .map_err(|e| format!("写入图片失败: {}", e))?;

        return Ok(());
    }

    Err(format!("下载图片失败（重试{}次）: {}", max_retries, last_error))
}

// 下载UP主头像
async fn download_avatar(client: &reqwest::Client, app_handle: &AppHandle, mid: i64, face_url: &str) -> Option<String> {
    if face_url.is_empty() {
        return None;
    }

    let avatars_dir = get_avatars_dir(app_handle);
    let ext = get_extension_from_url(face_url);
    let filename = format!("{}.{}", mid, ext);
    let save_path = avatars_dir.join(&filename);

    match download_image(client, face_url, &save_path).await {
        Ok(_) => Some(save_path.to_string_lossy().to_string()),
        Err(e) => {
            eprintln!("下载头像失败 mid={}: {}", mid, e);
            None
        }
    }
}

// 下载视频封面
async fn download_cover(client: &reqwest::Client, app_handle: &AppHandle, bvid: &str, cover_url: &str) -> Option<String> {
    if cover_url.is_empty() {
        return None;
    }

    let covers_dir = get_covers_dir(app_handle);
    let ext = get_extension_from_url(cover_url);
    let filename = format!("{}.{}", bvid, ext);
    let save_path = covers_dir.join(&filename);

    match download_image(client, cover_url, &save_path).await {
        Ok(_) => Some(save_path.to_string_lossy().to_string()),
        Err(e) => {
            eprintln!("下载封面失败 bvid={}: {}", bvid, e);
            None
        }
    }
}

// 批量下载封面（带频率控制和进度更新）
async fn download_covers_batch(
    client: &reqwest::Client,
    app_handle: &AppHandle,
    videos: &mut Vec<VideoInfo>,
    cover_urls: &[(String, String)],  // (bvid, cover_url)
    batch_size: usize,
    delay_ms: u64,
) {
    let total = videos.len();

    // 建立 bvid -> cover_url 的映射
    let url_map: std::collections::HashMap<&str, &str> = cover_urls
        .iter()
        .map(|(bvid, url)| (bvid.as_str(), url.as_str()))
        .collect();

    for (i, video) in videos.iter_mut().enumerate() {
        // 发送下载进度
        let _ = app_handle.emit("scrape-progress", ScrapeProgress {
            current: (i + 1) as i32,
            total: total as i32,
            page: 0,
            message: format!("正在下载视频封面 ({}/{})", i + 1, total),
        });

        if let Some(&cover_url) = url_map.get(video.bvid.as_str()) {
            if let Some(local_path) = download_cover(client, app_handle, &video.bvid, cover_url).await {
                video.cover = Some(local_path);
            }
        }

        // 每下载 batch_size 张图片后暂停一下，避免请求过快
        if (i + 1) % batch_size == 0 {
            tokio::time::sleep(tokio::time::Duration::from_millis(delay_ms)).await;
        }
    }
}

fn init_database(db_path: &PathBuf) -> Result<Connection, String> {
    let conn = Connection::open(db_path).map_err(|e| format!("打开数据库失败: {}", e))?;

    // 创建UP主表（只存储本地头像路径）
    conn.execute(
        "CREATE TABLE IF NOT EXISTS up_users (
            mid INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            sign TEXT,
            level INTEGER,
            face TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    ).map_err(|e| format!("创建up_users表失败: {}", e))?;

    // 创建视频表（只存储本地封面路径）
    conn.execute(
        "CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mid INTEGER NOT NULL,
            bvid TEXT NOT NULL UNIQUE,
            aid INTEGER,
            title TEXT NOT NULL,
            publish_time TEXT,
            duration TEXT,
            play_count INTEGER,
            danmu_count INTEGER,
            comment_count INTEGER,
            favorite_count INTEGER,
            category TEXT,
            description TEXT,
            cover TEXT,
            video_url TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (mid) REFERENCES up_users(mid)
        )",
        [],
    ).map_err(|e| format!("创建videos表失败: {}", e))?;

    // 创建索引
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_videos_mid ON videos(mid)",
        [],
    ).map_err(|e| format!("创建索引失败: {}", e))?;

    // 创建设置表（用于存储 Cookie 等配置）
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )",
        [],
    ).map_err(|e| format!("创建settings表失败: {}", e))?;

    Ok(conn)
}

// 保存设置到数据库
fn save_setting(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    ).map_err(|e| format!("保存设置失败: {}", e))?;
    Ok(())
}

// 从数据库读取设置
fn load_setting(conn: &Connection, key: &str) -> Option<String> {
    conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        [key],
        |row| row.get(0),
    ).ok()
}

// 保存UP主信息到数据库
fn save_up_info_to_db(conn: &Connection, up_info: &UpInfo) -> Result<(), String> {
    conn.execute(
        "INSERT INTO up_users (mid, name, sign, level, face, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP)
         ON CONFLICT(mid) DO UPDATE SET
            name = excluded.name,
            sign = excluded.sign,
            level = excluded.level,
            face = COALESCE(excluded.face, face),
            updated_at = CURRENT_TIMESTAMP",
        params![up_info.mid, up_info.name, up_info.sign, up_info.level, up_info.face],
    ).map_err(|e| format!("保存UP主信息失败: {}", e))?;
    Ok(())
}

// 保存视频列表到数据库
fn save_videos_to_db(conn: &Connection, mid: i64, videos: &[VideoInfo]) -> Result<(), String> {
    for video in videos {
        conn.execute(
            "INSERT INTO videos (mid, bvid, aid, title, publish_time, duration, play_count,
             danmu_count, comment_count, favorite_count, category, description, cover, video_url)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
             ON CONFLICT(bvid) DO UPDATE SET
                play_count = excluded.play_count,
                danmu_count = excluded.danmu_count,
                comment_count = excluded.comment_count,
                favorite_count = excluded.favorite_count,
                cover = COALESCE(excluded.cover, cover)",
            params![
                mid, video.bvid, video.aid, video.title, video.publish_time, video.duration,
                video.play_count, video.danmu_count, video.comment_count, video.favorite_count,
                video.category, video.description, video.cover, video.video_url
            ],
        ).map_err(|e| format!("保存视频失败: {}", e))?;
    }
    Ok(())
}

// 从数据库加载UP主列表
fn load_up_list_from_db(conn: &Connection) -> Result<Vec<UpInfo>, String> {
    let mut stmt = conn.prepare(
        "SELECT mid, name, sign, level, face FROM up_users ORDER BY updated_at DESC"
    ).map_err(|e| format!("准备查询失败: {}", e))?;

    let up_iter = stmt.query_map([], |row| {
        Ok(UpInfo {
            mid: row.get(0)?,
            name: row.get(1)?,
            sign: row.get(2)?,
            level: row.get(3)?,
            face: row.get(4)?,
        })
    }).map_err(|e| format!("查询UP主列表失败: {}", e))?;

    let mut ups = Vec::new();
    for up in up_iter {
        ups.push(up.map_err(|e| format!("读取UP主数据失败: {}", e))?);
    }
    Ok(ups)
}

// 从数据库加载指定UP主的视频
fn load_videos_from_db(conn: &Connection, mid: i64) -> Result<Vec<VideoInfo>, String> {
    let mut stmt = conn.prepare(
        "SELECT bvid, aid, title, publish_time, duration, play_count, danmu_count,
         comment_count, favorite_count, category, description, cover, video_url
         FROM videos WHERE mid = ?1 ORDER BY publish_time DESC"
    ).map_err(|e| format!("准备查询失败: {}", e))?;

    let video_iter = stmt.query_map([mid], |row| {
        Ok(VideoInfo {
            bvid: row.get(0)?,
            aid: row.get(1)?,
            title: row.get(2)?,
            publish_time: row.get(3)?,
            duration: row.get(4)?,
            play_count: row.get(5)?,
            danmu_count: row.get(6)?,
            comment_count: row.get(7)?,
            favorite_count: row.get(8)?,
            category: row.get(9)?,
            description: row.get(10)?,
            cover: row.get(11)?,
            video_url: row.get(12)?,
        })
    }).map_err(|e| format!("查询视频列表失败: {}", e))?;

    let mut videos = Vec::new();
    for video in video_iter {
        videos.push(video.map_err(|e| format!("读取视频数据失败: {}", e))?);
    }
    Ok(videos)
}

// 从数据库删除UP主及其视频
fn delete_up_from_db(conn: &Connection, mid: i64) -> Result<(), String> {
    conn.execute("DELETE FROM videos WHERE mid = ?1", [mid])
        .map_err(|e| format!("删除视频失败: {}", e))?;
    conn.execute("DELETE FROM up_users WHERE mid = ?1", [mid])
        .map_err(|e| format!("删除UP主失败: {}", e))?;
    Ok(())
}

// WBI 签名相关函数
fn get_mixin_key(orig: &str) -> String {
    MIXIN_KEY_ENC_TAB
        .iter()
        .take(32)
        .filter_map(|&i| orig.chars().nth(i))
        .collect()
}

fn enc_wbi(params: &mut HashMap<String, String>, img_key: &str, sub_key: &str) {
    let mixin_key = get_mixin_key(&format!("{}{}", img_key, sub_key));

    let curr_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    params.insert("wts".to_string(), curr_time.to_string());

    // 按 key 排序
    let mut sorted_params: Vec<_> = params.iter().collect();
    sorted_params.sort_by(|a, b| a.0.cmp(b.0));

    // 过滤特殊字符并构建查询字符串
    let query: String = sorted_params
        .iter()
        .map(|(k, v)| {
            let filtered_v: String = v.chars().filter(|c| !"!'()*".contains(*c)).collect();
            format!("{}={}", urlencoding::encode(k), urlencoding::encode(&filtered_v))
        })
        .collect::<Vec<_>>()
        .join("&");

    // 计算 MD5
    let mut hasher = Md5::new();
    hasher.update(format!("{}{}", query, mixin_key).as_bytes());
    let w_rid = format!("{:x}", hasher.finalize());

    params.insert("w_rid".to_string(), w_rid);
}

fn build_headers(cookie: &str) -> HeaderMap {
    let mut headers = HeaderMap::new();
    headers.insert(
        USER_AGENT,
        HeaderValue::from_static(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ),
    );
    headers.insert(REFERER, HeaderValue::from_static("https://www.bilibili.com"));
    if !cookie.is_empty() {
        if let Ok(cookie_value) = HeaderValue::from_str(cookie) {
            headers.insert(COOKIE, cookie_value);
        }
    }
    headers
}

// Tauri 命令

#[tauri::command]
async fn set_cookie(cookie: String, app: AppHandle, state: State<'_, Arc<ScraperState>>) -> Result<bool, String> {
    // 保存到内存
    let mut cookie_lock = state.cookie.lock().await;
    *cookie_lock = cookie.clone();

    // 持久化到数据库
    let db_path = get_db_path(&app);
    if let Ok(conn) = init_database(&db_path) {
        let _ = save_setting(&conn, "cookie", &cookie);
    }
    Ok(true)
}

#[tauri::command]
async fn get_cookie(app: AppHandle, state: State<'_, Arc<ScraperState>>) -> Result<String, String> {
    // 先尝试从内存获取
    let cookie = state.cookie.lock().await.clone();
    if !cookie.is_empty() {
        return Ok(cookie);
    }

    // 内存为空则从数据库加载
    let db_path = get_db_path(&app);
    if let Ok(conn) = init_database(&db_path) {
        if let Some(saved_cookie) = load_setting(&conn, "cookie") {
            // 同步到内存
            *state.cookie.lock().await = saved_cookie.clone();
            return Ok(saved_cookie);
        }
    }
    Ok(String::new())
}

#[tauri::command]
async fn init_wbi_keys(state: State<'_, Arc<ScraperState>>) -> Result<bool, String> {
    let cookie = state.cookie.lock().await.clone();
    let client = reqwest::Client::new();
    let headers = build_headers(&cookie);

    let resp = client
        .get("https://api.bilibili.com/x/web-interface/nav")
        .headers(headers)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    let json: serde_json::Value = resp.json().await.map_err(|e| format!("解析JSON失败: {}", e))?;

    if json["code"].as_i64() != Some(0) {
        return Err("获取WBI keys失败".to_string());
    }

    let img_url = json["data"]["wbi_img"]["img_url"]
        .as_str()
        .ok_or("获取img_url失败")?;
    let sub_url = json["data"]["wbi_img"]["sub_url"]
        .as_str()
        .ok_or("获取sub_url失败")?;

    let img_key = img_url
        .rsplit('/')
        .next()
        .and_then(|s| s.split('.').next())
        .ok_or("解析img_key失败")?
        .to_string();

    let sub_key = sub_url
        .rsplit('/')
        .next()
        .and_then(|s| s.split('.').next())
        .ok_or("解析sub_key失败")?
        .to_string();

    *state.img_key.lock().await = img_key;
    *state.sub_key.lock().await = sub_key;

    Ok(true)
}

// 内部使用的获取UP主信息（返回 face_url 用于下载）
async fn fetch_up_info_with_url(
    client: &reqwest::Client,
    headers: &HeaderMap,
    mid: i64,
    img_key: &str,
    sub_key: &str,
) -> Result<(UpInfo, String), String> {
    let mut params: HashMap<String, String> = HashMap::new();
    params.insert("mid".to_string(), mid.to_string());
    enc_wbi(&mut params, img_key, sub_key);

    let url = format!(
        "https://api.bilibili.com/x/space/wbi/acc/info?{}",
        params
            .iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect::<Vec<_>>()
            .join("&")
    );

    let resp = client
        .get(&url)
        .headers(headers.clone())
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    let json: serde_json::Value = resp.json().await.map_err(|e| format!("解析JSON失败: {}", e))?;

    if json["code"].as_i64() != Some(0) {
        return Err(format!(
            "获取UP主信息失败: {}",
            json["message"].as_str().unwrap_or("未知错误")
        ));
    }

    let data = &json["data"];
    let face_url = data["face"].as_str().unwrap_or("").to_string();

    Ok((UpInfo {
        name: data["name"].as_str().unwrap_or("").to_string(),
        sign: data["sign"].as_str().unwrap_or("").to_string(),
        level: data["level"].as_i64().unwrap_or(0) as i32,
        face: None,
        mid,
    }, face_url))
}

#[tauri::command]
async fn get_up_info(mid: i64, state: State<'_, Arc<ScraperState>>) -> Result<UpInfo, String> {
    let cookie = state.cookie.lock().await.clone();
    let img_key = state.img_key.lock().await.clone();
    let sub_key = state.sub_key.lock().await.clone();

    let client = reqwest::Client::new();
    let headers = build_headers(&cookie);

    let (up_info, _) = fetch_up_info_with_url(&client, &headers, mid, &img_key, &sub_key).await?;
    Ok(up_info)
}

#[tauri::command]
async fn scrape_videos(
    mid: i64,
    app: AppHandle,
    state: State<'_, Arc<ScraperState>>,
) -> Result<ScrapeResult, String> {
    // 检查是否已经在运行
    {
        let mut is_running = state.is_running.lock().await;
        if *is_running {
            return Err("已有爬取任务在运行".to_string());
        }
        *is_running = true;
    }

    let cookie = state.cookie.lock().await.clone();
    let img_key = state.img_key.lock().await.clone();
    let sub_key = state.sub_key.lock().await.clone();

    let client = reqwest::Client::new();
    let headers = build_headers(&cookie);

    let mut all_videos: Vec<VideoInfo> = Vec::new();
    let mut cover_urls: Vec<(String, String)> = Vec::new();  // (bvid, cover_url)
    let mut total_count = 0i32;
    let mut max_pages = i32::MAX; // 初始化为最大值，第一次请求后会更新

    let mut page = 1;
    loop {
        if page > max_pages {
            break;
        }
        let mut params: HashMap<String, String> = HashMap::new();
        params.insert("mid".to_string(), mid.to_string());
        params.insert("ps".to_string(), "30".to_string());
        params.insert("tid".to_string(), "0".to_string());
        params.insert("pn".to_string(), page.to_string());
        params.insert("keyword".to_string(), "".to_string());
        params.insert("order".to_string(), "pubdate".to_string());

        enc_wbi(&mut params, &img_key, &sub_key);

        let url = format!(
            "https://api.bilibili.com/x/space/wbi/arc/search?{}",
            params
                .iter()
                .map(|(k, v)| format!("{}={}", k, v))
                .collect::<Vec<_>>()
                .join("&")
        );

        let resp = match client.get(&url).headers(headers.clone()).send().await {
            Ok(r) => r,
            Err(e) => {
                *state.is_running.lock().await = false;
                return Err(format!("请求失败: {}", e));
            }
        };

        let json: serde_json::Value = match resp.json().await {
            Ok(j) => j,
            Err(e) => {
                *state.is_running.lock().await = false;
                return Err(format!("解析JSON失败: {}", e));
            }
        };

        if json["code"].as_i64() != Some(0) {
            *state.is_running.lock().await = false;
            return Err(format!(
                "API错误: {}",
                json["message"].as_str().unwrap_or("未知错误")
            ));
        }

        let vlist = match json["data"]["list"]["vlist"].as_array() {
            Some(v) => v,
            None => {
                break;
            }
        };

        if vlist.is_empty() {
            break;
        }

        total_count = json["data"]["page"]["count"].as_i64().unwrap_or(0) as i32;

        // 第一次请求后，根据总视频数计算需要的页数（每页30个视频）
        if page == 1 && total_count > 0 {
            max_pages = (total_count + 29) / 30; // 向上取整
        }

        for v in vlist {
            let created = v["created"].as_i64().unwrap_or(0);
            let publish_time = chrono::DateTime::from_timestamp(created, 0)
                .map(|dt| dt.format("%Y-%m-%d %H:%M:%S").to_string())
                .unwrap_or_default();

            let bvid = v["bvid"].as_str().unwrap_or("").to_string();
            let cover_url = v["pic"].as_str().unwrap_or("").to_string();

            // 记录封面URL用于后续下载
            if !cover_url.is_empty() {
                cover_urls.push((bvid.clone(), cover_url));
            }

            all_videos.push(VideoInfo {
                title: v["title"].as_str().unwrap_or("").to_string(),
                bvid: bvid.clone(),
                aid: v["aid"].as_i64().unwrap_or(0),
                publish_time,
                duration: v["length"].as_str().unwrap_or("").to_string(),
                play_count: v["play"].as_i64().unwrap_or(0),
                danmu_count: v["video_review"].as_i64().unwrap_or(0),
                comment_count: v["comment"].as_i64().unwrap_or(0),
                favorite_count: v["favorites"].as_i64().unwrap_or(0),
                category: v["typename"].as_str().unwrap_or("").to_string(),
                description: v["description"]
                    .as_str()
                    .unwrap_or("")
                    .chars()
                    .take(100)
                    .collect(),
                cover: None,  // 稍后下载
                video_url: format!("https://www.bilibili.com/video/{}", bvid),
            });
        }

        // 发送进度更新
        let progress = ScrapeProgress {
            current: all_videos.len() as i32,
            total: total_count,
            page,
            message: format!("正在爬取第{}页...", page),
        };
        let _ = app.emit("scrape-progress", progress);

        if all_videos.len() as i32 >= total_count {
            break;
        }

        // 延迟避免请求过快
        tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;

        page += 1;
    }

    *state.is_running.lock().await = false;

    // 获取UP主信息（带 face_url）
    let (mut up_info, face_url) = match fetch_up_info_with_url(&client, &headers, mid, &img_key, &sub_key).await {
        Ok((info, url)) => (Some(info), url),
        Err(_) => (None, String::new()),
    };

    // 下载UP主头像
    if let Some(ref mut info) = up_info {
        let _ = app.emit("scrape-progress", ScrapeProgress {
            current: 0,
            total: all_videos.len() as i32,
            page: 0,
            message: "正在下载UP主头像...".to_string(),
        });
        if let Some(local_path) = download_avatar(&client, &app, mid, &face_url).await {
            info.face = Some(local_path);
        }
    }

    // 批量下载视频封面（带频率控制：每5张暂停500ms）
    download_covers_batch(&client, &app, &mut all_videos, &cover_urls, 5, 500).await;

    // 保存数据到SQLite数据库
    let db_path = get_db_path(&app);
    if let Ok(conn) = init_database(&db_path) {
        if let Some(ref info) = up_info {
            let _ = save_up_info_to_db(&conn, info);
        }
        let _ = save_videos_to_db(&conn, mid, &all_videos);
    }

    Ok(ScrapeResult {
        up_info,
        videos: all_videos,
        success: true,
        error: None,
    })
}

#[tauri::command]
async fn stop_scraping(state: State<'_, Arc<ScraperState>>) -> Result<bool, String> {
    *state.is_running.lock().await = false;
    Ok(true)
}

// 获取已保存的UP主列表
#[tauri::command]
async fn get_saved_up_list(app: AppHandle) -> Result<Vec<UpInfo>, String> {
    let db_path = get_db_path(&app);
    let conn = init_database(&db_path)?;
    load_up_list_from_db(&conn)
}

// 加载指定UP主的视频数据
#[tauri::command]
async fn load_up_videos(mid: i64, app: AppHandle) -> Result<ScrapeResult, String> {
    let db_path = get_db_path(&app);
    let conn = init_database(&db_path)?;

    // 加载UP主信息
    let mut stmt = conn.prepare(
        "SELECT mid, name, sign, level, face FROM up_users WHERE mid = ?1"
    ).map_err(|e| format!("准备查询失败: {}", e))?;

    let up_info = stmt.query_row([mid], |row| {
        Ok(UpInfo {
            mid: row.get(0)?,
            name: row.get(1)?,
            sign: row.get(2)?,
            level: row.get(3)?,
            face: row.get(4)?,
        })
    }).ok();

    // 加载视频列表
    let videos = load_videos_from_db(&conn, mid)?;

    Ok(ScrapeResult {
        up_info,
        videos,
        success: true,
        error: None,
    })
}

// 删除已保存的UP主
#[tauri::command]
async fn delete_saved_up(mid: i64, app: AppHandle) -> Result<bool, String> {
    let db_path = get_db_path(&app);
    let conn = init_database(&db_path)?;
    delete_up_from_db(&conn, mid)?;
    Ok(true)
}

#[tauri::command]
async fn export_csv(videos: Vec<VideoInfo>, path: String) -> Result<bool, String> {
    let mut wtr = csv::Writer::from_path(&path).map_err(|e| format!("创建CSV失败: {}", e))?;

    // 写入表头
    wtr.write_record(&[
        "标题",
        "BVID",
        "AID",
        "发布时间",
        "时长",
        "播放量",
        "弹幕数",
        "评论数",
        "收藏数",
        "分区",
        "简介",
        "视频链接",
    ])
    .map_err(|e| format!("写入表头失败: {}", e))?;

    for v in videos {
        wtr.write_record(&[
            v.title,
            v.bvid,
            v.aid.to_string(),
            v.publish_time,
            v.duration,
            v.play_count.to_string(),
            v.danmu_count.to_string(),
            v.comment_count.to_string(),
            v.favorite_count.to_string(),
            v.category,
            v.description,
            v.video_url,
        ])
        .map_err(|e| format!("写入数据失败: {}", e))?;
    }

    wtr.flush().map_err(|e| format!("保存文件失败: {}", e))?;
    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Arc::new(ScraperState::default()))
        .invoke_handler(tauri::generate_handler![
            set_cookie,
            get_cookie,
            init_wbi_keys,
            get_up_info,
            scrape_videos,
            stop_scraping,
            get_saved_up_list,
            load_up_videos,
            delete_saved_up,
            export_csv,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
