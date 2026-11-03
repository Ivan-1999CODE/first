// Preserve the previous task's saved work before loading the new drink task.
const drinksLoad = load;
load = function() {
 try {
  const raw = localStorage.getItem(course.id), archiveKey = course.id + '-before-drinks-v1';
  if (raw && !localStorage.getItem(archiveKey)) {
   const saved = JSON.parse(raw);
   if (Object.keys(saved.answers || {}).some(k=>k.endsWith('-CD') || k.includes('day6-dessert-and-coffee')) || Object.keys(saved.checks || {}).some(k=>k.includes('day6-dessert-and-coffee'))) {
    localStorage.setItem(archiveKey,raw);
   }
  }
 } catch { storageFailed = true; }
 drinksLoad();
};
