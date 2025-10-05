// 晴れの日のキャラクター画像のパスを定義
const miyamakirishima = '/character/sunny/miyamakirishima.png';
const rurikakesu = '/character/sunny/rurikakesu.png';
const satumanishiki = '/character/sunny/satumanishiki.png';
const sotetsu = '/character/sunny/sotetsu.png';

// 雨/曇りの日のキャラクター画像のパスを定義
const amamiishikawagaeru = '/character/cloudy_rainy/amamiishikawagaeru.png';
const amaminokurousagi = '/character/cloudy_rainy/amaminokurousagi.png';
const hikagehego = '/character/cloudy_rainy/hikagehego.png';
const oosumisansyouuo = '/character/cloudy_rainy/oosumisansyouuo.png';
const ootoratugumi = '/character/cloudy_rainy/ootoratugumi.png';

// 背景画像をまとめてインポート
// ※もし背景画像やアイコンも public ディレクトリにある場合は、上記と同様にパス文字列に変更してください。
// ※src/assets 内にある場合は、このまま import 文を使用します。
import background_sunny from '../assets/background/background_sunny.png';
import background_cloudy from '../assets/background/background_cloudy.png';
import background_rainy from '../assets/background/background_rainy.png';
import background_snowy from '../assets/background/background_snowy.png';

// 天気アイコン画像のインポート
import icon_sunny from '../assets/weather/sunny.jpg';
import icon_cloudy from '../assets/weather/cloudy.jpg';
import icon_rainy from '../assets/weather/rainy.jpg';

// 天気ごとのデータをオブジェクトにまとめる
export const weatherAssets = {
  sunny: {
    background: background_sunny,
    icon: icon_sunny,
    characters: {
      ground: [miyamakirishima, sotetsu,rurikakesu, satumanishiki],
      sky: [],
    },
  },
  cloudy: {
    background: background_cloudy,
    icon: icon_cloudy,
    characters: {
      ground: [amamiishikawagaeru, amaminokurousagi, hikagehego, oosumisansyouuo, ootoratugumi],
      sky: [],
    },
  },
  rainy: {
    background: background_rainy,
    icon: icon_rainy,
    characters: {
      ground: [amamiishikawagaeru, amaminokurousagi, hikagehego, oosumisansyouuo, ootoratugumi],
      sky: [],
    },
  },
  snowy: {
    background: background_snowy,
    characters: {
      ground: [],
      sky: []
    },
  },
};