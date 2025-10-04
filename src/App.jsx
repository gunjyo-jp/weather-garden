import { useState, useEffect } from 'react';
import './App.css';
import { weatherAssets } from './utils/imageLoader';
import infoUrban from './data'
const apiKey = import.meta.env.VITE_WEATHER_APP_KEY;

  const user =  { lat: 31.56028, lon: 130.55806 };
  

// --- 重なりをチェックしてキャラクターを配置する関数を定義 ---
/**
 * 指定されたエリア内で、キャラクターが重ならないように配置します。
 * @param {Array<string>} characters - 配置するキャラクター画像の配列
 * @param {number} count - 配置する数
 * @returns {Array<object>} - スタイル情報を含んだキャラクターの配列
 */
const placeCharactersWithoutOverlap = (characters, count) => {
  if (!characters || characters.length === 0) return [];

  const placed = [];
  const characterWidth = 15; // 重なり判定用の幅 (%)
  const characterHeight = 15; // 重なり判定用の高さ (%)
  const maxAttempts = 50;

  // 1. キャラクターをシャッフルして指定された数だけ選ぶ
  const selected = [...characters].sort(() => 0.5 - Math.random()).slice(0, count);

  for (const charSrc of selected) {
    let attempts = 0;
    let isOverlapping;
    let position;

    do {
      isOverlapping = false;
      const top = Math.random() * (100 - characterHeight);
      const left = Math.random() * (100 - characterWidth);

      position = {
        top,
        left,
        right: left + characterWidth,
        bottom: top + characterHeight,
      };

      for (const p of placed) {
        if (
          position.left < p.right &&
          position.right > p.left &&
          position.top < p.bottom &&
          position.bottom > p.top
        ) {
          isOverlapping = true;
          break;
        }
      }
      attempts++;
    } while (isOverlapping && attempts < maxAttempts);

    placed.push({ ...position, src: charSrc });
  }

  // 最終的なスタイル情報に変換して返す
  return placed.map(char => ({
    src: char.src,
    style: {
      top: `${char.top}%`,
      left: `${char.left}%`,
      transform: `scale(${Math.random() * 0.5 + 0.8})`,
    },
  }));
};


function App() {
  const weather = 'sunny';
  // stateを地面用と空中用に分ける
  const [groundCharacters, setGroundCharacters] = useState([]);
  const [skyCharacters, setSkyCharacters] = useState([]);
  const [weatherData,setWeatherData] = useState(null);



  useEffect(() => {
    const assets = weatherAssets[weather];

    //OpenWeatherAPIで気象データを取得
    

    navigator.geolocation.getCurrentPosition((position) => {
      user.lat = position.coords.latitude;
      user.lon = position.coords.longitude;
      console.log(user.lon, user.lat);
      console.log(user);

    }, () => {
      console.log("位置情報を取得できませんでした。");
    });
    
    fetchData({weatherData,setWeatherData,user});
      
    if (!assets) return;

    // 地面のキャラクターを2体配置
    const groundChars = placeCharactersWithoutOverlap(assets.characters.ground, 2);
    setGroundCharacters(groundChars);

    // 空中のキャラクターを1体配置
    const skyChars = placeCharactersWithoutOverlap(assets.characters.sky, 1);
    setSkyCharacters(skyChars);

  }, []);



  function fetchData({user}){
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${user.lat}&lon=${user.lon}&appid=${apiKey}&units=metric&lang=ja`)
      .then(res => {
        res.json();
      })
      .then(json => {
        setWeatherData(json)
        console.log(json);
      });

      // console.log(weatherData);
    }


  const backgroundStyle = {
    backgroundImage: `url(${weatherAssets[weather].background})`,
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

      <div className="weather-info">
        {/* (天気情報部分は変更なし) */}
      </div>
    </div>
  );


}

export default App;