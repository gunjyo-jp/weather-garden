import { useState, useEffect } from 'react';
import './App.css';
import { weatherAssets } from './utils/imageLoader';
import infoUrban from './data'
const apiKey = import.meta.env.VITE_WEATHER_APP_KEY;
const user = { lat: 31.56028, lon: 130.55806 };


/**
 * 指定されたエリア内で、キャラクターが重ならないように配置します。
 * @param {Array<string>} characters - 配置するキャラクター画像の配列
 * @param {number} count - 配置する数
 * @param {object} options - 配置オプション (placementType, horizontalRange)
 * @returns {Array<object>} - スタイル情報を含んだキャラクターの配列
 */
const placeCharactersWithoutOverlap = (characters, count, options = {}) => {
  // デフォルト値を設定
  const {
    placementType = 'ground',
    horizontalRange = [0, 100], // デフォルトは画面全体 [開始地点, 終了地点]
  } = options;

  if (!characters || characters.length === 0) return [];

  const placed = [];
  const characterWidth = 15;
  const maxAttempts = 50;
  const selected = [...characters].sort(() => 0.5 - Math.random()).slice(0, count);

  // 配置範囲を計算
  const minLeft = horizontalRange[0];
  const maxLeft = horizontalRange[1];
  const availableWidth = maxLeft - minLeft - characterWidth;

  for (const charSrc of selected) {
    let attempts = 0;
    let isOverlapping;
    let position;
    do {
      isOverlapping = false;
      // 指定された範囲内で 'left' の値を計算する
      const left = availableWidth > 0 ? (Math.random() * availableWidth) + minLeft : minLeft;

      position = { left, right: left + characterWidth };
      for (const p of placed) {
        if (position.left < p.right && position.right > p.left) {
          isOverlapping = true;
          break;
        }
      }
      attempts++;
    } while (isOverlapping && attempts < maxAttempts);
    placed.push({ ...position, src: charSrc });
  }

  return placed.map(char => {
    const style = {
      left: `${char.left}%`,
      transform: `scale(${Math.random() * 0.5 + 0.8})`,
    };
    if (placementType === 'ground') {
      style.bottom = `${Math.random() * 15}%`; // 地面キャラは 'bottom' を基準
    } else {
      style.top = `${Math.random() * 85}%`; // 空中キャラは 'top' を基準
    }
    return { src: char.src, style };
  });
};

function App() {
  const [weatherType,setWeatherType] = useState('sunny');
  // let weather = "Sunny";
  // stateを地面用と空中用に分ける
  const [groundCharacters, setGroundCharacters] = useState([]);
  const [skyCharacters, setSkyCharacters] = useState([]);

  const [weatherData, setWeatherData] = useState(null);
  const user = { lat: 31.56028, lon: 130.55806 };



  //起動時のレンダリング
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      user.lat = position.coords.latitude;
      user.lon = position.coords.longitude;
      console.log(user.lon, user.lat);

      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${user.lat}&lon=${user.lon}&appid=${apiKey}&units=metric&lang=ja`)
        .then(res => res.json())
        .then(json => {
          setWeatherData(json);
        });

    }, () => {
      console.log("位置情報を取得できませんでした。");
    });
    //API取得
  }, []);



  useEffect(() => {
    if (!weatherData) return;
    const weatherType = weatherData.weather[0].main;
    let weather ="";

    if (weatherType === "Clear") {
      weather = "sunny";
      
    }
    else if (weatherType === "Clouds") {
      weather = "cloudy";
    }
    else {
     weather = "rainy";
    }

    setWeatherType(weather);

    const assets = weatherAssets[weather];
    if (!assets) return;

    // 地面のキャラクターを左右の範囲を限定して配置
    const groundOptions = {
      placementType: 'ground',
      horizontalRange: [15, 85], // 左端15%〜右端85%の範囲に配置
    };
    const groundChars = placeCharactersWithoutOverlap(assets.characters.ground, 2, groundOptions);
    setGroundCharacters(groundChars);

    // 空のキャラクターも同じ左右の範囲に限定して配置
    const skyOptions = {
      placementType: 'sky',
      horizontalRange: [15, 85],
    };
    const skyChars = placeCharactersWithoutOverlap(assets.characters.sky, 1, skyOptions);
    setSkyCharacters(skyChars);

    
  }, [weatherData]);

  const backgroundStyle = {
    backgroundImage: `url(${weatherAssets[weatherType]?.background})`,
  };

  return (
    <div className="app-container" style={backgroundStyle}>
      {/* 空中エリア */}
      <div className="sky">
        {skyCharacters.map((char, index) => (
          <img
            key={`sky-${index}`}
            src={char.src}
            alt={`character-${index}`}
            className="character"
            style={char.style}
          />
        ))}
      </div>

      {/* 地面エリア */}
      <div className="garden">
        {groundCharacters.map((char, index) => (
          <img
            key={`ground-${index}`}
            src={char.src}
            alt={`character-${index}`}
            className="character"
            style={char.style}
          />
        ))}
      </div>

      {/* 天気情報エリア */}
      <div className="weather-info">
        <div>① 天気のアイコン</div>
        <div>② 場所</div>
      </div>
    </div>
  );
}

export default App;