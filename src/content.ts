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

(function () {
    'use strict';
    let lastUrl = location.href;
    let isCollecting = true;

    chrome.storage.local.get(['collectionEnabled'], (result: StorageData) => {
        isCollecting = result.collectionEnabled !== false;
    });

    function extractVideoId(url: string): string {
        const match = url.match(/[?&]v=([^&]+)/);
        return match ? match[1] : '';
    }
    function extractSongFromListItem(element: Element): Song | null {
        try {
            const titleLink = element.querySelector('.title-column yt-formatted-string.title a, .title a') as HTMLAnchorElement;
            if (!titleLink) return null;
            const title = titleLink.textContent?.trim() || '';
            const songUrl = titleLink.href;
            const videoId = extractVideoId(songUrl);

            const secondaryColumns = element.querySelectorAll('.secondary-flex-columns yt-formatted-string a') as NodeListOf<HTMLAnchorElement>;
            let artist = '';
            let album = '';
            let artistUrl = '';
            let albumUrl = '';
            if (secondaryColumns.length >= 1) {
                artist = secondaryColumns[0].textContent?.trim() || '';
                artistUrl = secondaryColumns[0].href;
            }
            if (secondaryColumns.length >= 2) {
                album = secondaryColumns[1].textContent?.trim() || '';
                albumUrl = secondaryColumns[1].href;
            }

            const explicitBadge = element.querySelector('.explicit-badge');
            const isExplicit = explicitBadge !== null;
            return {
                title,
                artist,
                album,
                videoId,
                songUrl,
                artistUrl,
                albumUrl,
                explicit: isExplicit,
                timestamp: new Date().toISOString(),
                pageUrl: location.href,
                pageType: determinePageType()
            };
        } catch (error) {
            console.log('Error extracting song data:', error);
            return null;
        }
    }
    function determinePageType(): string {
        const url = location.href;
        const pathname = location.pathname;
        if (url.includes('playlist')) return 'playlist';
        if (pathname.includes('library/liked_songs')) return 'liked_songs';
        if (pathname.includes('history')) return 'history';
        if (pathname.includes('/watch')) return 'now_playing';
        if (pathname.includes('library')) return 'library';
        if (pathname.includes('search')) return 'search';
        return 'unknown';
    }
    function extractCurrentlyPlaying(): Song | null {
        try {
            const titleElement = document.querySelector('.title.ytmusic-player-bar, [class*="title"]:not(.subtitle)');
            const artistElement = document.querySelector('.subtitle.ytmusic-player-bar, .byline');
            if (!titleElement) return null;
            const title = titleElement.textContent?.trim() || '';
            const artist = artistElement ? artistElement.textContent?.trim() || '' : '';
            const videoId = extractVideoId(location.href);
            return {
                title,
                artist,
                album: '',
                videoId,
                songUrl: location.href,
                artistUrl: '',
                albumUrl: '',
                explicit: false,
                timestamp: new Date().toISOString(),
                pageUrl: location.href,
                pageType: 'now_playing',
                action: 'played'
            };
        } catch (error) {
            console.log('Error extracting currently playing:', error);
            return null;
        }
    }
    function extractSongsFromPage(): Song[] {
        const songs: Song[] = [];

        const songElements = document.querySelectorAll(`
            ytmusic-responsive-list-item-renderer,
            .ytmusic-responsive-list-item-renderer,
            [class*="list-item-renderer"]
        `);
        songElements.forEach(element => {
            const song = extractSongFromListItem(element);
            if (song && song.title) {
                songs.push(song);
            }
        });
        return songs;
    }
    function saveSongData(songs: Song[]): void {
        if (!songs || songs.length === 0) return;

        const uniqueSongs: Song[] = [];
        const seenInBatch = new Set<string>();
        for (const song of songs) {
            const key = `${song.videoId}-${song.pageType}`;
            if (!seenInBatch.has(key)) {
                seenInBatch.add(key);
                uniqueSongs.push(song);
            }
        }

        chrome.storage.local.get(['collectedSongs'], (result: StorageData) => {
            const existingSongs = result.collectedSongs || [];

            const newSongs = uniqueSongs.filter(song => {
                return !existingSongs.some((existing: Song) =>
                    existing.videoId === song.videoId &&
                    existing.pageType === song.pageType
                );
            });
            if (newSongs.length > 0) {
                const updatedSongs = [...existingSongs, ...newSongs];
                chrome.storage.local.set({ collectedSongs: updatedSongs });
                console.log(`Saved ${newSongs.length} new songs. Total: ${updatedSongs.length}`);

                chrome.runtime.sendMessage({
                    action: 'songsCollected',
                    count: newSongs.length,
                    total: updatedSongs.length
                } as Message);
            }
        });
    }
    function handlePageChange(): void {
        if (!isCollecting) return;
        const pageType = determinePageType();
        console.log('YouTube Music page detected:', pageType);

        setTimeout(() => {
            if (pageType === 'now_playing') {
                const currentSong = extractCurrentlyPlaying();
                if (currentSong) {
                    saveSongData([currentSong]);
                }
            } else {
                const songs = extractSongsFromPage();
                if (songs.length > 0) {
                    saveSongData(songs);
                }
            }
        }, 2000);
    }

    function watchForNavigation(): void {
        const observer = new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                handlePageChange();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse: (response: MessageResponse) => void) => {
        if (message.action === 'toggleCollection') {
            isCollecting = message.enabled || false;
            sendResponse({ success: true });
        } else if (message.action === 'extractNow') {
            const songs = extractSongsFromPage();
            saveSongData(songs);
            sendResponse({ count: songs.length });
        }
    });

    if (location.href.includes('music.youtube.com')) {
        watchForNavigation();
        handlePageChange();
    }
})();