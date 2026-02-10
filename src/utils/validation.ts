import { existsSync, statSync } from 'fs';
import { extname } from 'path';

export function validateFile(filePath: string): { valid: boolean; error?: string } {
  if (!existsSync(filePath)) {
    return { valid: false, error: 'File does not exist' };
  }
  
  const stats = statSync(filePath);
  if (!stats.isFile()) {
    return { valid: false, error: 'Path is not a file' };
  }
  
  return { valid: true };
}

export function validateVideoFile(filePath: string): { valid: boolean; error?: string } {
  const fileCheck = validateFile(filePath);
  if (!fileCheck.valid) return fileCheck;
  
  const videoExtensions = ['.mp4', '.mov', '.avi', '.flv', '.wmv', '.webm', '.mkv', '.m4v'];
  const ext = extname(filePath).toLowerCase();
  
  if (!videoExtensions.includes(ext)) {
    return { 
      valid: false, 
      error: `Invalid video format. Supported: ${videoExtensions.join(', ')}` 
    };
  }
  
  return { valid: true };
}

export function validateImageFile(filePath: string): { valid: boolean; error?: string } {
  const fileCheck = validateFile(filePath);
  if (!fileCheck.valid) return fileCheck;
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const ext = extname(filePath).toLowerCase();
  
  if (!imageExtensions.includes(ext)) {
    return { 
      valid: false, 
      error: `Invalid image format. Supported: ${imageExtensions.join(', ')}` 
    };
  }
  
  const stats = statSync(filePath);
  const maxSize = 2 * 1024 * 1024; // 2MB
  
  if (stats.size > maxSize) {
    return { 
      valid: false, 
      error: 'Image size exceeds 2MB limit' 
    };
  }
  
  return { valid: true };
}

export function validateVideoId(videoId: string): boolean {
  // YouTube video IDs are 11 characters
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

export function validatePrivacyStatus(status: string): boolean {
  return ['public', 'private', 'unlisted'].includes(status);
}

export function validateCategoryId(categoryId: string): boolean {
  // Valid YouTube category IDs (common ones)
  const validCategories = [
    '1', '2', '10', '15', '17', '18', '19', '20', '21', '22', 
    '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34',
    '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'
  ];
  return validCategories.includes(categoryId);
}

export function validatePort(port: number): boolean {
  return port >= 1024 && port <= 65535;
}

export function validateClientId(clientId: string): boolean {
  // Basic format check for Google OAuth Client ID
  return clientId.length > 20 && clientId.includes('.apps.googleusercontent.com');
}

export function validateClientSecret(clientSecret: string): boolean {
  // Basic format check
  return clientSecret.length >= 24;
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
