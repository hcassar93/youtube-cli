import Table from 'cli-table3';
import dayjs from 'dayjs';
import chalk from 'chalk';

export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function formatDate(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function createTable(head: string[]): Table.Table {
  return new Table({
    head: head.map(h => chalk.cyan(h)),
    style: {
      head: [],
      border: ['grey']
    }
  });
}

export function formatVideoList(videos: any[]): string {
  const table = createTable(['Video ID', 'Title', 'Views', 'Status', 'Published']);
  
  videos.forEach(video => {
    table.push([
      video.id,
      video.snippet.title.substring(0, 30),
      formatNumber(parseInt(video.statistics?.viewCount || '0')),
      video.status.privacyStatus,
      formatDate(video.snippet.publishedAt)
    ]);
  });
  
  return table.toString();
}

export function formatChannelList(channels: any[]): string {
  const table = createTable(['Channel ID', 'Name', 'Subscribers', 'Videos']);
  
  channels.forEach(channel => {
    table.push([
      channel.id,
      channel.snippet.title,
      formatNumber(parseInt(channel.statistics?.subscriberCount || '0')),
      formatNumber(parseInt(channel.statistics?.videoCount || '0'))
    ]);
  });
  
  return table.toString();
}

export function formatPlaylistList(playlists: any[]): string {
  const table = createTable(['Playlist ID', 'Title', 'Items', 'Status']);
  
  playlists.forEach(playlist => {
    table.push([
      playlist.id,
      playlist.snippet.title.substring(0, 40),
      playlist.contentDetails?.itemCount || '0',
      playlist.status?.privacyStatus || 'N/A'
    ]);
  });
  
  return table.toString();
}

export function formatCommentList(comments: any[]): string {
  const table = createTable(['Author', 'Comment', 'Likes', 'Date']);
  
  comments.forEach(comment => {
    const snippet = comment.snippet.topLevelComment?.snippet || comment.snippet;
    table.push([
      snippet.authorDisplayName,
      snippet.textDisplay.substring(0, 50) + (snippet.textDisplay.length > 50 ? '...' : ''),
      formatNumber(snippet.likeCount || 0),
      formatDate(snippet.publishedAt)
    ]);
  });
  
  return table.toString();
}

export function maskSecret(secret: string, visibleChars: number = 4): string {
  if (!secret || secret.length <= visibleChars) return '***';
  return secret.substring(0, visibleChars) + '*'.repeat(secret.length - visibleChars);
}

export function toJSON(data: any): string {
  return JSON.stringify(data, null, 2);
}

export function toCSV(data: any[], headers: string[]): string {
  const rows = [headers.join(',')];
  
  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header] || '';
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    });
    rows.push(row.join(','));
  });
  
  return rows.join('\n');
}
