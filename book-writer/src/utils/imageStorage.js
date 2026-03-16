// Chapter images are uploaded to S3 via the API and the URL is stored in the
// book's chapter data in DynamoDB — making them visible to shared users too.
// localStorage is used only as a local cache to avoid re-uploading on reload.

const PREFIX = 'bw_img_';

export const saveChapterImageLocal = (bookId, chapterId, imageUrl) => {
  try {
    localStorage.setItem(`${PREFIX}${bookId}_${chapterId}`, imageUrl);
  } catch (e) {
    console.warn('Failed to cache image URL:', e);
  }
};

export const loadChapterImageLocal = (bookId, chapterId) =>
  localStorage.getItem(`${PREFIX}${bookId}_${chapterId}`) || null;

export const deleteChapterImageLocal = (bookId, chapterId) =>
  localStorage.removeItem(`${PREFIX}${bookId}_${chapterId}`);

// Merge image URLs back into book chapters.
// Chapters loaded from the API already carry imageUrl (visible to shared users).
// Fall back to localStorage cache for the local user.
export const mergeImagesIntoBook = (book) => {
  const bookId = book.bookId || book.id;
  return {
    ...book,
    chapters: book.chapters.map(ch => ({
      ...ch,
      imageUrl: ch.imageUrl || loadChapterImageLocal(bookId, ch.id) || null,
    })),
  };
};

// Compress and resize an image file using canvas before uploading.
// Keeps images under ~100KB so API Gateway / Lambda handles them quickly.
export const compressImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = reject;
  reader.onload = (e) => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      const MAX_W = 900;
      const MAX_H = 700;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX_W) { h = Math.round(h * MAX_W / w); w = MAX_W; }
      if (h > MAX_H) { w = Math.round(w * MAX_H / h); h = MAX_H; }
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataURL = canvas.toDataURL('image/jpeg', 0.78);
      resolve({ dataURL, width: w, height: h });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});
