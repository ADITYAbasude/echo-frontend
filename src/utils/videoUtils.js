export const formatViews = (views) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views;
};


export const formatVideoDuration = (duration) => {
  const date = new Date(0);
  date.setMilliseconds(duration);
  const timeString = date.toISOString().substr(11, 8);
  return timeString.replace(/^00:/, "");
}

export const formatVideoDate = (timestamp) => {
  try {
    const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    
    if (!timestampNum || isNaN(timestampNum)) {
      return 'Invalid date';
    }

    const now = new Date();
    const date = new Date(timestampNum);
    const diffTime = now - date;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Handle recent posts
    if (diffMinutes < 60) {
      if (diffMinutes <= 1) return 'Just now';
      return `${diffMinutes} minutes ago`;
    }
    
    if (diffHours < 24) {
      if (diffHours === 1) return '1 hour ago';
      return `${diffHours} hours ago`;
    }
    
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

// Note: The previous formatVideoDate function was actually handling duration
// You might want to rename it to formatVideoDuration