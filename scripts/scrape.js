/**
 * TrafficPulse Data Scraper
 *
 * Yahoo路線情報から電車遅延情報を取得
 * ※社内利用限定・自己責任で運用
 */

const fs = require('fs');
const path = require('path');

// 対象路線の定義（関東エリア）
const TARGET_LINES = [
  { id: 'yamanote', name: '山手線', yahoo_id: '21', color: '#9acd32', coords: [[35.7281, 139.7103], [35.7319, 139.7184], [35.7367, 139.7258], [35.7298, 139.7429], [35.7130, 139.7535], [35.6917, 139.7600], [35.6684, 139.7587], [35.6553, 139.7494], [35.6459, 139.7386], [35.6459, 139.7101], [35.6580, 139.7016], [35.6762, 139.6999], [35.6917, 139.7003], [35.7069, 139.7024], [35.7281, 139.7103]] },
  { id: 'chuo-rapid', name: '中央線快速', yahoo_id: '24', color: '#ff6600', coords: [[35.6813, 139.7660], [35.6809, 139.7364], [35.6658, 139.7093], [35.6639, 139.6844], [35.6996, 139.5814], [35.7010, 139.5446]] },
  { id: 'chuo-sobu', name: '中央・総武線各停', yahoo_id: '25', color: '#ffd400', coords: [[35.7050, 139.8779], [35.6983, 139.8145], [35.6813, 139.7660], [35.6658, 139.7093], [35.6996, 139.5814]] },
  { id: 'keihin-tohoku', name: '京浜東北線', yahoo_id: '22', color: '#00b2e5', coords: [[35.9076, 139.6270], [35.7281, 139.7103], [35.6813, 139.7660], [35.6298, 139.7390], [35.5658, 139.7157]] },
  { id: 'tokaido', name: '東海道線', yahoo_id: '26', color: '#f68b1e', coords: [[35.6813, 139.7660], [35.6298, 139.7390], [35.4667, 139.6223], [35.3397, 139.5500]] },
  { id: 'yokosuka', name: '横須賀線', yahoo_id: '27', color: '#0066cc', coords: [[35.6813, 139.7660], [35.6298, 139.7390], [35.4667, 139.6223], [35.2833, 139.6667]] },
  { id: 'saikyo', name: '埼京線', yahoo_id: '28', color: '#00a650', coords: [[35.9134, 139.6332], [35.7281, 139.7103], [35.6580, 139.7016], [35.6195, 139.7005]] },
  { id: 'metro-ginza', name: '銀座線', yahoo_id: '102', color: '#ff9500', coords: [[35.7110, 139.7966], [35.7034, 139.7714], [35.6813, 139.7660], [35.6684, 139.7587], [35.6580, 139.7016]] },
  { id: 'metro-marunouchi', name: '丸ノ内線', yahoo_id: '103', color: '#f62e36', coords: [[35.7281, 139.7103], [35.7069, 139.7517], [35.6813, 139.7660], [35.6684, 139.7587], [35.6553, 139.7494], [35.6459, 139.7386]] },
  { id: 'metro-hibiya', name: '日比谷線', yahoo_id: '104', color: '#b5b5ac', coords: [[35.7539, 139.8052], [35.7130, 139.7793], [35.6813, 139.7660], [35.6580, 139.7016], [35.6298, 139.7155]] },
  { id: 'metro-tozai', name: '東西線', yahoo_id: '105', color: '#009bbf', coords: [[35.6745, 139.8145], [35.6813, 139.7660], [35.7034, 139.7508], [35.7110, 139.6243]] },
  { id: 'metro-chiyoda', name: '千代田線', yahoo_id: '109', color: '#00bb85', coords: [[35.7677, 139.8234], [35.7367, 139.7429], [35.6813, 139.7660], [35.6298, 139.7155]] },
  { id: 'metro-yurakucho', name: '有楽町線', yahoo_id: '107', color: '#c1a470', coords: [[35.7551, 139.6995], [35.7281, 139.7103], [35.6813, 139.7660], [35.6459, 139.7101]] },
  { id: 'metro-hanzomon', name: '半蔵門線', yahoo_id: '111', color: '#8f76d6', coords: [[35.7110, 139.8100], [35.6813, 139.7660], [35.6580, 139.7016], [35.6267, 139.6402]] },
  { id: 'metro-namboku', name: '南北線', yahoo_id: '128', color: '#00ac9b', coords: [[35.7815, 139.7348], [35.7281, 139.7103], [35.6813, 139.7660], [35.6337, 139.7406]] },
  { id: 'metro-fukutoshin', name: '副都心線', yahoo_id: '142', color: '#9c5e31', coords: [[35.7551, 139.6995], [35.7281, 139.7103], [35.6917, 139.7003], [35.6580, 139.7016]] },
  { id: 'toei-asakusa', name: '都営浅草線', yahoo_id: '114', color: '#e85298', coords: [[35.7860, 139.8082], [35.7034, 139.7714], [35.6580, 139.7016], [35.5886, 139.7390]] },
  { id: 'toei-mita', name: '都営三田線', yahoo_id: '115', color: '#0079c2', coords: [[35.7816, 139.6836], [35.7281, 139.7103], [35.6580, 139.7016], [35.6298, 139.7155]] },
  { id: 'toei-shinjuku', name: '都営新宿線', yahoo_id: '116', color: '#6cbb5a', coords: [[35.6896, 139.6998], [35.6917, 139.7600], [35.7034, 139.8370]] },
  { id: 'toei-oedo', name: '都営大江戸線', yahoo_id: '126', color: '#b6007a', coords: [[35.7110, 139.7966], [35.6917, 139.7003], [35.6580, 139.7016], [35.6684, 139.7587], [35.7069, 139.7517]] },
  { id: 'keio', name: '京王線', yahoo_id: '68', color: '#dd0077', coords: [[35.6896, 139.6998], [35.6779, 139.6568], [35.6593, 139.5882], [35.6512, 139.5442]] },
  { id: 'odakyu', name: '小田急小田原線', yahoo_id: '69', color: '#2b5caa', coords: [[35.6896, 139.6998], [35.6308, 139.6173], [35.5424, 139.4463], [35.4658, 139.3423]] },
  { id: 'tokyu-toyoko', name: '東急東横線', yahoo_id: '78', color: '#ee1155', coords: [[35.6580, 139.7016], [35.6339, 139.6991], [35.6064, 139.6685], [35.5755, 139.6587], [35.5162, 139.6165]] },
  { id: 'tokyu-denentoshi', name: '東急田園都市線', yahoo_id: '79', color: '#00a040', coords: [[35.6580, 139.7016], [35.6267, 139.6402], [35.5770, 139.5935], [35.5091, 139.5171]] },
];

// Yahoo路線情報のベースURL
const YAHOO_TRANSIT_URL = 'https://transit.yahoo.co.jp/diainfo/area/4';

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TrafficPulse/1.0; internal-use-only)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ja'
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

function parseDelayInfo(html) {
  const results = [];

  // 遅延情報のパターンを抽出
  // Yahoo路線情報ページから遅延中の路線を検出

  TARGET_LINES.forEach(line => {
    let status = 'normal';
    let delayMinutes = 0;
    let description = '平常どおり運転しています';
    let section = null;

    // HTMLから路線名を検索して状態を判定
    const lineNamePattern = new RegExp(line.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');

    if (html.includes(line.name)) {
      // 遅延キーワードを検索
      const delayPatterns = [
        { pattern: /運転見合わせ|運休|運転中止/g, status: 'suspended' },
        { pattern: /(\d+)分.*遅[れ延]/g, status: 'delayed' },
        { pattern: /遅[れ延]|ダイヤ乱れ|遅延/g, status: 'minor' }
      ];

      // HTMLの該当路線周辺を抽出して解析
      const lineIndex = html.indexOf(line.name);
      if (lineIndex !== -1) {
        const context = html.substring(Math.max(0, lineIndex - 200), Math.min(html.length, lineIndex + 500));

        if (/運転見合わせ|運休|運転中止/.test(context)) {
          status = 'suspended';
          delayMinutes = null;
          description = '運転を見合わせています';

          // 区間を抽出
          const sectionMatch = context.match(/([^\s〜～]+[駅]?\s*[〜～]\s*[^\s〜～]+[駅]?)/);
          if (sectionMatch) section = sectionMatch[1];
        } else if (/遅[れ延]|ダイヤ乱れ/.test(context)) {
          const minuteMatch = context.match(/(\d+)\s*分/);
          delayMinutes = minuteMatch ? parseInt(minuteMatch[1]) : 10;
          status = delayMinutes >= 15 ? 'delayed' : 'minor';
          description = `${delayMinutes}分程度の遅れが出ています`;
        }
      }
    }

    results.push({
      id: line.id,
      name: line.name,
      color: line.color,
      status,
      delayMinutes,
      description,
      section,
      coordinates: line.coords,
      updatedAt: new Date().toISOString()
    });
  });

  return results;
}

async function scrapeTrainDelays() {
  console.log('🚃 電車遅延情報を取得中...');

  try {
    const html = await fetchWithRetry(YAHOO_TRANSIT_URL);
    const trainData = parseDelayInfo(html);

    // 遅延している路線数をカウント
    const delayedCount = trainData.filter(t => t.status !== 'normal').length;
    console.log(`  → ${trainData.length}路線中、${delayedCount}路線で遅延/見合わせ`);

    return trainData;
  } catch (error) {
    console.error('❌ 電車遅延情報の取得に失敗:', error.message);
    return null;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('TrafficPulse Data Scraper');
  console.log(`実行時刻: ${new Date().toLocaleString('ja-JP')}`);
  console.log('='.repeat(50));

  // 電車遅延情報を取得
  const trainData = await scrapeTrainDelays();

  if (trainData) {
    const outputPath = path.join(__dirname, '..', 'data', 'trains.json');
    const output = {
      lastUpdated: new Date().toISOString(),
      source: 'Yahoo Transit (関東エリア)',
      disclaimer: '本データは社内利用限定です。再配布禁止。',
      trains: trainData
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`\n✅ 保存完了: ${outputPath}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('完了');
}

main().catch(console.error);
