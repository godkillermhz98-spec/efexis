// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use once_cell::sync::OnceCell;
use std::env;
use std::path::Path;
use std::sync::Mutex;
use tauri::{path::BaseDirectory, AppHandle, Emitter, Listener, Manager};

mod rpc;
mod runner;

// Global static instance of the Discord client
static DISCORD_CLIENT: OnceCell<Mutex<Option<rpc::Client>>> = OnceCell::new();

fn get_discord_client() -> &'static Mutex<Option<rpc::Client>> {
    DISCORD_CLIENT.get_or_init(|| Mutex::new(None))
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command(rename_all = "snake_case")]
async fn create_fake_game(
    handle: tauri::AppHandle,
    path: &str,
    executable_name: &str,
    path_len: i64,
    app_id: i64,
) -> Result<String, String> {
    // Must create in the same directory as the executable to avoid permission issues
    // Get the executable directory to look for config file
    let exe_path: std::path::PathBuf = env::current_exe().unwrap_or_default();
    let exe_dir = exe_path.parent().unwrap_or_else(|| Path::new(""));

    let normalized_path = Path::new(path).to_string_lossy().to_string();

    let game_folder_path = exe_dir
        .join("games")
        .join(app_id.to_string())
        .join(normalized_path);

    println!("Game folder path: {:?}", game_folder_path);
    println!(
        "Game full path: {:?}",
        game_folder_path.join(executable_name)
    );

    // Ok(format!("Dummy executable copied to: {:?}", target_executable_path))
    match std::fs::create_dir_all(&game_folder_path) {
        Ok(_) => {
            println!("Successfully created directory: {:?}", game_folder_path);
        }
        Err(e) => return Err(format!("Failed to create game folder: {}", e)),
    };
    // copy the dummy executable to the created folder
    // there is a `template.exe` file along the final build.
    let resource_path = handle
        .path()
        .resolve("data/src-win.exe", BaseDirectory::Resource)
        .unwrap_or_default();

    println!("Creating dummy game executable: {:?}", resource_path);
    let dummy_executable_path = exe_dir.join("template.exe");
    let target_executable_path = game_folder_path.join(executable_name);
    match std::fs::copy(&resource_path, &target_executable_path) {
        Ok(_) => Ok(format!(
            "Dummy executable copied to: {:?}",
            target_executable_path
        )),
        Err(e) => Err(format!("Failed to copy dummy executable: {}", e)),
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn run_background_process(
    name: &str,
    path: &str,
    executable_name: &str,
    path_len: i64,
    app_id: i64,
) -> Result<String, String> {
    let exe_path = env::current_exe().unwrap_or_default();
    let exe_dir = exe_path.parent().unwrap_or_else(|| Path::new(""));

    let normalized_path = Path::new(path).to_string_lossy().to_string();

    let game_folder_path = exe_dir
        .join("games")
        .join(app_id.to_string())
        .join(normalized_path);
    let executable_path = game_folder_path.join(executable_name);
    // const DETACHED_PROCESS: u32 = 0x00000008;
    // const CREATE_NO_WINDOW: u32 = 0x08000000; // Hide the window
    match std::process::Command::new(&executable_path)
        .args(["--title", name])
        .current_dir(game_folder_path) // Set working directory to the game folder
        .spawn()
    {
        Ok(_) => Ok("Process started successfully".to_string()),
        Err(e) => Err(format!("Failed to start process: {}", e)),
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn stop_process(exec_name: String) -> Result<(), String> {
    // Stop the process using taskkill command
    let output = std::process::Command::new("taskkill")
        .arg("/F")
        .arg("/IM")
        .arg(exec_name)
        .output()
        .map_err(|e| format!("Failed to execute taskkill: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        Err(format!(
            "Failed to stop process: {}",
            String::from_utf8_lossy(&output.stderr)
        ))
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn check_process_running(exec_name: String) -> Result<bool, String> {
    let output = std::process::Command::new("tasklist")
        .args(["/FI", &format!("IMAGENAME eq {}", exec_name)])
        .output()
        .map_err(|e| format!("Failed to execute tasklist: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.contains(&exec_name))
}

/// Usage: Calling from JS:
/// ```javascript
/// await invoke('connect_to_discord_rpc_3', json, 'connect' | 'disconnect');
#[tauri::command(rename_all = "snake_case")]
fn connect_to_discord_rpc_3(handle: AppHandle, activity_json: String, action: String) {
    let app = handle.clone();

    let event_connecting = "client_connecting";
    let event_connected = "client_connected";
    let event_disconnect = "event_disconnect";
    let event_connect = "event_connect";

    let activity = runner::parse_activity_json(&activity_json).unwrap();

    let connecting_payload = serde_json::json!({
        "app_id": activity.app_id,
    });

    let client_option = {
        let mut client_guard = get_discord_client().lock().unwrap();
        // Take the client out, leaving None in its place
        client_guard.take()
        // MutexGuard is dropped here at the end of scope
    };

    let task = tauri::async_runtime::spawn(async move {
        handle
            .emit(event_connecting, connecting_payload)
            .unwrap_or_else(|e| eprintln!("Failed to emit event: {}", e));

        let client = runner::set_activity(activity_json)
            .await
            .map_err(|e| {
                println!("Failed to set activity: {}", e);
            })
            .unwrap();

        let connected_payload = serde_json::json!({
            "app_id": activity.app_id,
        });

        {
            let mut client_guard = get_discord_client().lock().unwrap();
            *client_guard = Some(client);
        }

        handle
            .emit(event_connected, connected_payload)
            .unwrap_or_else(|e| {
                eprintln!("Failed to emit event: {}", e);
            });

        handle.listen(event_disconnect, move |_| {
            println!("Disconnecting from Discord RPC inner");
            let disconnect_task = tauri::async_runtime::spawn(async move {
                let client_option = {
                    let mut client_guard = get_discord_client().lock().unwrap();
                    // Take the client out, leaving None in its place
                    client_guard.take()
                    // MutexGuard is dropped here at the end of scope
                };
                if let Some(client) = client_option {
                    client.discord.disconnect().await;
                    println!("Disconnected from Discord RPC inner");
                }
            });
            // disconnect_task.abort();
        });
    });

    app.listen(event_disconnect, move |_| {
        println!("Disconnecting from Discord RPC...");
        task.abort();
    });
}

#[tauri::command(rename_all = "snake_case")]
async fn fetch_gamelist_gh_mirror() -> tauri::ipc::Response {
    let res = tauri_plugin_http::reqwest::get("https://markterence.github.io/discord-quest-completer/detectable.json").await;
    tauri::ipc::Response::new(res.unwrap().text().await.unwrap())
}

#[tauri::command(rename_all = "snake_case")]
async fn fetch_gamelist_from_discord() -> tauri::ipc::Response {
    let res = tauri_plugin_http::reqwest::get("https://discord.com/api/applications/detectable").await;
    tauri::ipc::Response::new(res.unwrap().text().await.unwrap())
}

#[tauri::command(rename_all = "snake_case")]
async fn fetch_steam_game_data(name: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .build()
        .map_err(|e| format!("Failed to build client: {}", e))?;
        
    let search_res = client.get("https://store.steampowered.com/api/storesearch/")
        .query(&[
            ("term", &name),
            ("l", &"english".to_string()),
            ("cc", &"US".to_string())
        ])
        .send()
        .await
        .map_err(|e| format!("Steam search request failed: {}", e))?;
        
    let search_json: serde_json::Value = search_res.json()
        .await
        .map_err(|e| format!("Failed to parse search JSON: {}", e))?;
        
    let items = search_json.get("items")
        .and_then(|i| i.as_array());
        
    if let Some(items) = items {
        if !items.is_empty() {
            let app_id = items[0].get("id")
                .and_then(|id| id.as_i64());
                
            if let Some(app_id) = app_id {
                let app_id_str = app_id.to_string();
                let game_name = items[0].get("name").and_then(|n| n.as_str()).unwrap_or(&name).to_string();
                
                // Try to query storefront appdetails API
                let mut got_details = None;
                if let Ok(details_res) = client.get("https://store.steampowered.com/api/appdetails")
                    .query(&[("appids", &app_id_str)])
                    .send()
                    .await
                {
                    if let Ok(details_json) = details_res.json::<serde_json::Value>().await {
                        if let Some(app_data) = details_json.get(&app_id_str) {
                            if let Some(success) = app_data.get("success").and_then(|s| s.as_bool()) {
                                if success {
                                    if let Some(data) = app_data.get("data") {
                                        got_details = Some(data.to_string());
                                    }
                                }
                            }
                        }
                    }
                }

                if let Some(details) = got_details {
                    return Ok(details);
                } else {
                    // Storefront API failed or returned success: false (e.g. age-gated game)
                    // Return constructed fallback JSON containing search data and standard fields
                    let fallback = serde_json::json!({
                        "steam_appid": app_id,
                        "name": game_name,
                        "header_image": format!("https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/{}/header.jpg", app_id),
                        "short_description": format!("Experience the ultimate journey in {}. A state-of-the-art virtual adventure featuring breathtaking environments, immersive multiplayer challenges, and deep customization.", game_name),
                        "developers": [format!("{} Studios", game_name)],
                        "publishers": [format!("{} Games", game_name)],
                        "genres": [
                            {"description": "Action"},
                            {"description": "Adventure"}
                        ],
                        "categories": [
                            {"description": "Single-player"},
                            {"description": "Multiplayer"}
                        ],
                        "release_date": {
                            "coming_soon": false,
                            "date": "TBA"
                        }
                    });
                    return Ok(fallback.to_string());
                }
            }
        }
    }
    
    Err("No matching game found on Steam".to_string())
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            create_fake_game,
            stop_process,
            connect_to_discord_rpc_3,
            run_background_process,
            fetch_gamelist_gh_mirror,
            fetch_gamelist_from_discord,
            check_process_running,
            fetch_steam_game_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
