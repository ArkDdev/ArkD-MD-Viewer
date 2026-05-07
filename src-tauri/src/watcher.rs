use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use notify::RecursiveMode;
use notify_debouncer_mini::{new_debouncer, DebouncedEventKind, Debouncer};
use tauri::{AppHandle, Emitter};

/// Holds the currently active watcher (if any) and a flag to suppress
/// events during our own writes.
pub struct WatcherState {
    debouncer: Option<Debouncer<notify::RecommendedWatcher>>,
    watched_path: Option<PathBuf>,
    /// When true, file change events are dropped on the floor.
    /// We set this true around our own save() and clear it shortly after.
    paused: Arc<Mutex<bool>>,
}

impl WatcherState {
    pub fn new() -> Self {
        Self {
            debouncer: None,
            watched_path: None,
            paused: Arc::new(Mutex::new(false)),
        }
    }

    /// Start watching `path`. Replaces any previous watcher.
    /// Emits a `file-changed` event with the path string when the file is
    /// modified externally.
    pub fn start(&mut self, app: AppHandle, path: PathBuf) -> Result<(), String> {
        // Drop the previous watcher (if any) before creating a new one
        self.debouncer = None;

        let paused = self.paused.clone();
        let app_clone = app.clone();
        let path_for_event = path.clone();

        // Debounce: collapse a burst of filesystem events (e.g. atomic-rename
        // saves from VS Code that fire delete+create in quick succession) into
        // a single notification. 200ms is the sweet spot — short enough to
        // feel responsive, long enough to coalesce the typical save burst.
        let mut debouncer = new_debouncer(Duration::from_millis(200), move |res: notify_debouncer_mini::DebounceEventResult| {
            // If we're paused (own write in progress), drop everything
            if *paused.lock().unwrap() {
                return;
            }

            let events = match res {
                Ok(events) => events,
                Err(_) => return,
            };

            // notify-debouncer-mini collapses events; we only get one Any per file
            for event in events {
                if event.kind == DebouncedEventKind::Any {
                    let _ = app_clone.emit(
                        "file-changed",
                        path_for_event.to_string_lossy().to_string(),
                    );
                    break;
                }
            }
        })
        .map_err(|e| format!("Failed to create watcher: {}", e))?;

        // Watch the file's parent directory non-recursively. Watching the
        // file itself fails when editors do atomic-rename saves (the inode
        // changes and the watch is lost). Watching the directory survives this.
        let parent = path
            .parent()
            .ok_or_else(|| "File has no parent directory".to_string())?;

        debouncer
            .watcher()
            .watch(parent, RecursiveMode::NonRecursive)
            .map_err(|e| format!("Failed to start watching: {}", e))?;

        self.debouncer = Some(debouncer);
        self.watched_path = Some(path);
        Ok(())
    }

    pub fn stop(&mut self) {
        self.debouncer = None;
        self.watched_path = None;
    }

    /// Mark the watcher paused. Events that arrive while paused are dropped.
    /// Use this around your own writes to the file.
    pub fn pause(&self) {
        *self.paused.lock().unwrap() = true;
    }

    pub fn resume(&self) {
        *self.paused.lock().unwrap() = false;
    }

    pub fn watched_path(&self) -> Option<PathBuf> {
        self.watched_path.clone()
    }
}

impl Default for WatcherState {
    fn default() -> Self {
        Self::new()
    }
}
