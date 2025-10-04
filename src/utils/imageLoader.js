// 晴れの日のキャラクター画像をまとめてインポート
import bug_mitsubachi from '../assets/character/sunny/bug_mitsubachi.png';
import butterfly from '../assets/character/sunny/butterfly.png';
import hibiscus from '../assets/character/sunny/hibiscus.png';
import himawari from '../assets/character/sunny/himawari.png';
import marigold from '../assets/character/sunny/marigold.png';
import tentomushi from '../assets/character/sunny/tentomushi.png';
import tonbo from '../assets/character/sunny/tonbo.png';

// 雨/曇りの日のキャラクター画像をまとめてインポート
import ajisai from '../assets/character/cloudy_rainy/ajisai.png';
import flog from '../assets/character/cloudy_rainy/flog.png';
import kanahebi from '../assets/character/cloudy_rainy/kanahebi.png';
import katatsumuri from '../assets/character/cloudy_rainy/katatsumuri.png';
import mimizu from '../assets/character/cloudy_rainy/mimizu.png';

// 背景画像をまとめてインポート
import background_sunny from '../assets/background/background_sunny.png';
import background_cloudy from '../assets/background/background_cloudy.png';
import background_rainy from '../assets/background/background_rainy.png';
import background_snowy from '../assets/background/background_snowy.png';


// 天気ごとのデータをオブジェクトにまとめる
export const weatherAssets = {
  sunny: {
    background: background_sunny,
    characters: [
      bug_mitsubachi,
      butterfly,
      hibiscus,
      himawari,
      marigold,
      tentomushi,
      tonbo,
    ],
  },
  cloudy: {
    background: background_cloudy,
    characters: [ajisai, flog, kanahebi, katatsumuri, mimizu],
  },
  rainy: {
    background: background_rainy,
    characters: [ajisai, flog, kanahebi, katatsumuri, mimizu],
  },
  snowy: {
    background: background_snowy,
    characters: [], // 雪の日のキャラクターがいればここに追加
  },
};