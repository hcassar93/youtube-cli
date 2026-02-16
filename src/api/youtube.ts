import { google, youtube_v3 } from 'googleapis';
import { createReadStream } from 'fs';
import { ensureValidToken } from '../auth/oauth.js';
import { getCredentials, getRefreshToken } from '../auth/credentials.js';
import chalk from 'chalk';

export class YouTubeAPI {
  private youtube: youtube_v3.Youtube | null = null;

  async initialize(): Promise<boolean> {
    const token = await ensureValidToken();
    if (!token) {
      return false;
    }

    const credentials = getCredentials();
    const refreshToken = getRefreshToken();
    
    if (!credentials) {
      console.error(chalk.red('OAuth credentials not found. Please run setup first.'));
      return false;
    }

    // Create OAuth2 client and set credentials
    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    );

    oauth2Client.setCredentials({
      access_token: token,
      refresh_token: refreshToken || undefined
    });

    this.youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    return true;
  }

  private ensureInitialized(): void {
    if (!this.youtube) {
      throw new Error('YouTube API not initialized. Call initialize() first.');
    }
  }

  async getChannels(): Promise<any[]> {
    this.ensureInitialized();
    
    const response = await this.youtube!.channels.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      mine: true
    });

    return response.data.items || [];
  }

  async getVideos(options: {
    maxResults?: number;
    status?: string;
  } = {}): Promise<any[]> {
    this.ensureInitialized();

    const channels = await this.getChannels();
    if (channels.length === 0) return [];

    const channelId = channels[0].id;

    const response = await this.youtube!.search.list({
      part: ['id', 'snippet'],
      channelId: channelId,
      type: ['video'],
      maxResults: options.maxResults || 10,
      order: 'date'
    });

    const videoIds = response.data.items?.map(item => item.id?.videoId).filter(Boolean) as string[];

    if (videoIds.length === 0) return [];

    const videosResponse = await this.youtube!.videos.list({
      part: ['snippet', 'statistics', 'status', 'contentDetails'],
      id: videoIds
    });

    let videos = videosResponse.data.items || [];

    if (options.status) {
      videos = videos.filter(video => video.status?.privacyStatus === options.status);
    }

    return videos;
  }

  async uploadVideo(options: {
    filePath: string;
    title: string;
    description?: string;
    privacy: string;
    category?: string;
    tags?: string[];
    onProgress?: (progress: number) => void;
  }): Promise<any> {
    this.ensureInitialized();

    const response = await this.youtube!.videos.insert(
      {
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: options.title,
            description: options.description || '',
            tags: options.tags || [],
            categoryId: options.category || '22'
          },
          status: {
            privacyStatus: options.privacy as any
          }
        },
        media: {
          body: createReadStream(options.filePath)
        }
      },
      {
        onUploadProgress: (evt) => {
          if (options.onProgress && evt.bytesRead) {
            const progress = Math.round((evt.bytesRead / (evt as any).totalBytes) * 100);
            options.onProgress(progress);
          }
        }
      }
    );

    return response.data;
  }

  async updateVideo(videoId: string, updates: {
    title?: string;
    description?: string;
    tags?: string[];
    category?: string;
    privacy?: string;
  }): Promise<any> {
    this.ensureInitialized();

    const existingVideo = await this.youtube!.videos.list({
      part: ['snippet', 'status'],
      id: [videoId]
    });

    if (!existingVideo.data.items || existingVideo.data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = existingVideo.data.items[0];
    const snippet = video.snippet!;
    const status = video.status!;

    const response = await this.youtube!.videos.update({
      part: ['snippet', 'status'],
      requestBody: {
        id: videoId,
        snippet: {
          title: updates.title || snippet.title,
          description: updates.description || snippet.description,
          tags: updates.tags || snippet.tags,
          categoryId: updates.category || snippet.categoryId
        },
        status: {
          privacyStatus: (updates.privacy || status.privacyStatus) as any
        }
      }
    });

    return response.data;
  }

  async deleteVideo(videoId: string): Promise<void> {
    this.ensureInitialized();

    await this.youtube!.videos.delete({
      id: videoId
    });
  }

  async getVideoStats(videoId: string): Promise<any> {
    this.ensureInitialized();

    const response = await this.youtube!.videos.list({
      part: ['snippet', 'statistics', 'status', 'contentDetails'],
      id: [videoId]
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Video not found');
    }

    return response.data.items[0];
  }

  async setThumbnail(videoId: string, imagePath: string): Promise<any> {
    this.ensureInitialized();

    const response = await this.youtube!.thumbnails.set({
      videoId: videoId,
      media: {
        body: createReadStream(imagePath)
      }
    });

    return response.data;
  }

  async getPlaylists(maxResults: number = 25): Promise<any[]> {
    this.ensureInitialized();

    const response = await this.youtube!.playlists.list({
      part: ['snippet', 'contentDetails', 'status'],
      mine: true,
      maxResults: maxResults
    });

    return response.data.items || [];
  }

  async createPlaylist(options: {
    title: string;
    description?: string;
    privacy: string;
  }): Promise<any> {
    this.ensureInitialized();

    const response = await this.youtube!.playlists.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: options.title,
          description: options.description || ''
        },
        status: {
          privacyStatus: options.privacy as any
        }
      }
    });

    return response.data;
  }

  async updatePlaylist(playlistId: string, updates: {
    title?: string;
    description?: string;
    privacy?: string;
  }): Promise<any> {
    this.ensureInitialized();

    const existing = await this.youtube!.playlists.list({
      part: ['snippet', 'status'],
      id: [playlistId]
    });

    const pl = existing.data.items?.[0];
    if (!pl) throw new Error('Playlist not found');

    const snippet = pl.snippet!;
    const status = pl.status!;

    const response = await this.youtube!.playlists.update({
      part: ['snippet', 'status'],
      requestBody: {
        id: playlistId,
        snippet: {
          title: updates.title ?? snippet.title,
          description: updates.description ?? snippet.description
        },
        status: {
          privacyStatus: (updates.privacy ?? status.privacyStatus) as any
        }
      }
    });

    return response.data;
  }

  async addToPlaylist(playlistId: string, videoId: string): Promise<any> {
    this.ensureInitialized();

    const response = await this.youtube!.playlistItems.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          playlistId: playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId: videoId
          }
        }
      }
    });

    return response.data;
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    this.ensureInitialized();

    await this.youtube!.playlists.delete({
      id: playlistId
    });
  }

  async getComments(videoId: string, maxResults: number = 20): Promise<any[]> {
    this.ensureInitialized();

    try {
      const response = await this.youtube!.commentThreads.list({
        part: ['snippet'],
        videoId: videoId,
        maxResults: maxResults,
        textFormat: 'plainText'
      });

      return response.data.items || [];
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error('Comments are disabled for this video');
      }
      throw error;
    }
  }

  async postComment(videoId: string, text: string): Promise<any> {
    this.ensureInitialized();

    const response = await this.youtube!.commentThreads.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          videoId: videoId,
          topLevelComment: {
            snippet: {
              textOriginal: text
            }
          }
        }
      }
    });

    return response.data;
  }
}

export const youtubeAPI = new YouTubeAPI();
