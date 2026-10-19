import fs from 'fs';
import { pinyin } from 'pinyin-pro';
import { BIBLE_BOOKS } from '../src/data/bibleBooks';

interface PericopeEntry {
  start: number;
  titleEn?: string;
  titleZh?: string;
  titlePinyin?: string;
}

// Map USFM book id to jburson name
function getJbursonDirName(nameEn: string): string {
  if (nameEn === 'Song of Songs') return 'Song of Solomon';
  if (nameEn === 'Psalms') return 'Psalm';
  return nameEn;
}

async function fetchNivHeadings(): Promise<Record<string, Array<{ start: number; titleEn: string }>>> {
  console.log('--- Fetching NIV headings from jburson bible-data ---');
  const nivMap: Record<string, Array<{ start: number; titleEn: string }>> = {};

  for (const b of BIBLE_BOOKS) {
    const dirName = getJbursonDirName(b.nameEn);
    const encodedDir = encodeURIComponent(dirName);
    const jsonUrl = `https://raw.githubusercontent.com/jburson/bible-data/main/data/niv/books/${encodedDir}/${encodedDir}.json`;

    try {
      const res = await fetch(jsonUrl);
      if (!res.ok) {
        console.error('Failed to fetch NIV:', b.id, dirName, res.status);
        continue;
      }
      const items = await res.json();
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.h === 2) {
          const titleEn = item.t?.trim();
          let startVerse = 1;
          let chapterNum = 1;

          for (let j = i + 1; j < Math.min(i + 10, items.length); j++) {
            const nextItem = items[j];
            if (nextItem.r) {
              const parts = nextItem.r.split(':');
              if (parts.length >= 4) {
                chapterNum = parseInt(parts[2], 10);
                const vNum = parseInt(parts[3], 10);
                if (vNum > 0) {
                  startVerse = vNum;
                  break;
                }
              }
            }
          }

          if (item.r) {
            const parts = item.r.split(':');
            if (parts.length >= 4) {
              chapterNum = parseInt(parts[2], 10);
              const vNum = parseInt(parts[3], 10);
              if (vNum === 0 && startVerse === 1) {
                // start verse 1
              } else if (startVerse === 1 && vNum > 0) {
                startVerse = vNum + 1;
              }
            }
          }

          const key = `${b.id}.${chapterNum}`;
          if (!nivMap[key]) nivMap[key] = [];
          nivMap[key].push({ start: startVerse, titleEn });
        }
      }
    } catch (e) {
      console.error('Error on NIV', b.id, e);
    }
  }

  console.log('NIV Headings loaded for', Object.keys(nivMap).length, 'chapters');
  return nivMap;
}

async function fetchCnvsHeadings(): Promise<Record<string, Array<{ start: number; titleZh: string }>>> {
  console.log('--- Fetching CNVS headings from bible.com ---');
  const cnvsMap: Record<string, Array<{ start: number; titleZh: string }>> = {};

  // Build list of all chapters to fetch
  const allChapters: Array<{ bookId: string; ch: number }> = [];
  for (const b of BIBLE_BOOKS) {
    for (let c = 1; c <= b.chaptersCount; c++) {
      allChapters.push({ bookId: b.id, ch: c });
    }
  }

  console.log(`Total chapters to fetch for CNVS: ${allChapters.length}`);

  // Fetch in batches of 25 with Promise.all
  const BATCH_SIZE = 25;
  for (let i = 0; i < allChapters.length; i += BATCH_SIZE) {
    const batch = allChapters.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async ({ bookId, ch }) => {
        const key = `${bookId}.${ch}`;
        const url = `https://www.bible.com/bible/41/${key}.CNVS`;
        try {
          const res = await fetch(url);
          if (!res.ok) return;
          const html = await res.text();
          const pieces = html.split(/ChapterContent-module__[^"]*__heading">/);
          for (let pIdx = 1; pIdx < pieces.length; pIdx++) {
            const headingText = pieces[pIdx].split('</span>')[0].trim();
            const chunk = pieces[pIdx].slice(0, 800);
            const labelMatch = chunk.match(/__label">(\d+)<\/span>/);
            const start = labelMatch ? parseInt(labelMatch[1], 10) : 1;

            if (!cnvsMap[key]) cnvsMap[key] = [];
            cnvsMap[key].push({ start, titleZh: headingText });
          }
        } catch (err) {
          // Ignore transient errors
        }
      })
    );

    if ((i + BATCH_SIZE) % 150 === 0 || i + BATCH_SIZE >= allChapters.length) {
      console.log(`Fetched CNVS up to chapter ${Math.min(i + BATCH_SIZE, allChapters.length)}/${allChapters.length}`);
    }
  }

  return cnvsMap;
}

async function main() {
  const nivMap = await fetchNivHeadings();
  const cnvsMap = await fetchCnvsHeadings();

  console.log('--- Merging NIV & CNVS Headings with Hanyu Pinyin ---');
  const merged: Record<string, PericopeEntry[]> = {};

  // For every chapter in the Bible
  for (const b of BIBLE_BOOKS) {
    for (let c = 1; c <= b.chaptersCount; c++) {
      const key = `${b.id}.${c}`;
      const nivList = nivMap[key] || [];
      const cnvsList = cnvsMap[key] || [];

      // Collect all verse start points
      const startsSet = new Set<number>();
      nivList.forEach((n) => startsSet.add(n.start));
      cnvsList.forEach((c) => startsSet.add(c.start));

      const sortedStarts = Array.from(startsSet).sort((a, b) => a - b);
      const entries: PericopeEntry[] = [];

      for (const start of sortedStarts) {
        const nivItem = nivList.find((n) => n.start === start);
        const cnvsItem = cnvsList.find((c) => c.start === start);

        let titleEn = nivItem?.titleEn;
        let titleZh = cnvsItem?.titleZh;

        // If no exact start match, see if there's a nearby heading
        if (!titleZh && cnvsList.length === 1 && sortedStarts.length === 1) {
          titleZh = cnvsList[0].titleZh;
        }
        if (!titleEn && nivList.length === 1 && sortedStarts.length === 1) {
          titleEn = nivList[0].titleEn;
        }

        let titlePinyin: string | undefined;
        if (titleZh) {
          titlePinyin = pinyin(titleZh);
        }

        entries.push({
          start,
          titleEn,
          titleZh,
          titlePinyin,
        });
      }

      if (entries.length > 0) {
        merged[key] = entries;
      }
    }
  }

  fs.writeFileSync('public/bibles/pericopes.json', JSON.stringify(merged, null, 2));
  console.log('Saved public/bibles/pericopes.json successfully! Total chapters with headings:', Object.keys(merged).length);
  console.log('GEN.1 sample:', merged['GEN.1']);
  console.log('GEN.2 sample:', merged['GEN.2']);
}

main().catch(console.error);
