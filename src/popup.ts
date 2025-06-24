interface Song {
    title: string;
    artist: string;
    album: string;
    videoId: string;
    songUrl: string;
    artistUrl: string;
    albumUrl: string;
    explicit: boolean;
    timestamp: string;
    pageUrl: string;
    pageType: string;
    action?: string;
}

interface StorageData {
    collectedSongs?: Song[];
    collectionEnabled?: boolean;
}

interface Message {
    action: string;
    enabled?: boolean;
    count?: number;
    total?: number;
}

interface MessageResponse {
    success?: boolean;
    count?: number;
}

interface ExportData {
    exportDate: string;
    totalSongs: number;
    songs: Song[];
}

document.addEventListener('DOMContentLoaded', () => {
    const totalCountEl = document.getElementById('totalCount') as HTMLSpanElement;
    const statusEl = document.getElementById('status') as HTMLSpanElement;
    const collectionEnabledEl = document.getElementById('collectionEnabled') as HTMLInputElement;
    const extractNowBtn = document.getElementById('extractNow') as HTMLButtonElement;
    const exportDataBtn = document.getElementById('exportData') as HTMLButtonElement;
    const cleanupDataBtn = document.getElementById('cleanupData') as HTMLButtonElement;
    const clearDataBtn = document.getElementById('clearData') as HTMLButtonElement;

    function updateStats(): void {
        chrome.storage.local.get(['collectedSongs', 'collectionEnabled'], (result: StorageData) => {
            const songs = result.collectedSongs || [];
            const isEnabled = result.collectionEnabled !== false;

            totalCountEl.textContent = songs.length.toString();
            collectionEnabledEl.checked = isEnabled;
            statusEl.textContent = isEnabled ? 'Active' : 'Paused';
        });
    }

    collectionEnabledEl.addEventListener('change', () => {
        const isEnabled = collectionEnabledEl.checked;

        chrome.storage.local.set({ collectionEnabled: isEnabled });

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleCollection',
                    enabled: isEnabled
                } as Message);
            }
        });
        updateStats();
    });

    extractNowBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'extractNow'
                } as Message, (response: MessageResponse) => {
                    if (response) {
                        alert(`Extracted ${response.count} songs from current page`);
                        updateStats();
                    }
                });
            }
        });
    });

    exportDataBtn.addEventListener('click', () => {
        chrome.storage.local.get(['collectedSongs'], (result: StorageData) => {
            const songs = result.collectedSongs || [];
            const exportData: ExportData = {
                exportDate: new Date().toISOString(),
                totalSongs: songs.length,
                songs: songs
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            chrome.downloads.download({
                url: url,
                filename: `youtube_music_data_${new Date().toISOString().split('T')[0]}.json`
            });
        });
    });

    cleanupDataBtn.addEventListener('click', () => {
        chrome.storage.local.get(['collectedSongs'], (result: StorageData) => {
            const songs = result.collectedSongs || [];
            const uniqueSongs: Song[] = [];
            const seen = new Set<string>();

            for (const song of songs) {
                const key = `${song.videoId}-${song.pageType}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueSongs.push(song);
                }
            }

            const removedCount = songs.length - uniqueSongs.length;
            if (removedCount > 0) {
                chrome.storage.local.set({ collectedSongs: uniqueSongs }, () => {
                    alert(`Removed ${removedCount} duplicate songs. ${uniqueSongs.length} unique songs remaining.`);
                    updateStats();
                });
            } else {
                alert('No duplicates found.');
            }
        });
    });

    clearDataBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all collected data?')) {
            chrome.storage.local.clear();
            updateStats();
        }
    });

    updateStats();
});