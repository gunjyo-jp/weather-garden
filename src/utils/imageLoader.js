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

// 天気アイコン画像のインポート
import icon_sunny from '../assets/weather/sunny.jpg';
import icon_cloudy from '../assets/weather/cloudy.jpg';
import icon_rainy from '../assets/weather/rainy.jpg';
// import icon_snowy from '../assets/weather/snowy.jpg'; // snowy.jpgがあればこちらもインポート

// 天気ごとのデータをオブジェクトにまとめる
export const weatherAssets = {
  sunny: {
    background: background_sunny,
    icon: icon_sunny,
    characters: {
      ground: [hibiscus, himawari, marigold, tentomushi],
      sky: [bug_mitsubachi, butterfly, tonbo],
    },
  },
  cloudy: {
    background: background_cloudy,
    icon: icon_cloudy,
    characters: {
      ground: [ajisai, flog, kanahebi, katatsumuri, mimizu],
      sky: [],
    },
  },
  rainy: {
    background: background_rainy,
    icon: icon_rainy,
    characters: {
      ground: [ajisai, flog, kanahebi, katatsumuri, mimizu],
      sky: []
    },
  },
  snowy: {
    background: background_snowy,
    // icon: icon_snowy, // snowy.jpgがあればコメント解除
    characters: {
      ground: [],
      sky: []
    },
  },
};