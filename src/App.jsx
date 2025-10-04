import { useState, useEffect } from 'react';
import './App.css';
import { weatherAssets } from './utils/imageLoader';

// Vite環境で.envファイルからAPIキーを読み込む
const apiKey = import.meta.env.VITE_WEATHER_APP_KEY;

const placeCharactersWithoutOverlap = (characters, count, options = {}) => {
  const { placementType = 'ground', horizontalRange = [0, 100] } = options;
  if (!characters || characters.length === 0) return [];
  const placed = [];
  const characterWidth = 15;
  const maxAttempts = 50;
  const selected = [...characters].sort(() => 0.5 - Math.random()).slice(0, count);
  const minLeft = horizontalRange[0];
  const maxLeft = horizontalRange[1];
  const availableWidth = maxLeft - minLeft - characterWidth;
  for (const charSrc of selected) {
    let attempts = 0;
    let isOverlapping;
    let position;
    do {
      isOverlapping = false;
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
      style.bottom = `${Math.random() * 15}%`;
    } else {
      style.top = `${Math.random() * 85}%`;
    }
    return { src: char.src, style };
  });
};

function App() {
  const [weather, setWeather] = useState('sunny');
  const [location, setLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [groundCharacters, setGroundCharacters] = useState([]);
  const [skyCharacters, setSkyCharacters] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // useEffect 1: 位置情報の取得
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => {
        // 取得失敗時はデフォルト位置（例: 東京駅）を設定
        setLocation({ lat: 35.6895, lon: 139.6917 });
      }
    );
  }, []);

  // useEffect 2: 天気情報の取得
  useEffect(() => {
    if (!location) return;

    const fetchWeather = async () => {
      try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric&lang=ja`);
        if (!response.ok) throw new Error('APIからの応答がありません');
        const data = await response.json();
        
        setWeatherData(data);

        const weatherId = data.weather[0].id;
        let newWeather = 'sunny';
        if (weatherId >= 200 && weatherId < 600) newWeather = 'rainy';
        else if (weatherId >= 801 && weatherId < 900) newWeather = 'cloudy';
        
        setWeather(newWeather);
      } catch (error) {
        console.error("天気情報の取得に失敗:", error);
      }
    };
    fetchWeather();
  }, [location]);

  // useEffect 3: キャラクターの配置
  useEffect(() => {
    const assets = weatherAssets[weather];
    if (!assets) return;
    const groundOptions = { placementType: 'ground', horizontalRange: [15, 85] };
    const groundChars = placeCharactersWithoutOverlap(assets.characters.ground, 2, groundOptions);
    setGroundCharacters(groundChars);
    const skyOptions = { placementType: 'sky', horizontalRange: [15, 85] };
    const skyChars = placeCharactersWithoutOverlap(assets.characters.sky, 1, skyOptions);
    setSkyCharacters(skyChars);
  }, [weather]);

  const handleCharacterClick = (character) => {
    const fileName = character.src.split('/').pop();
    alert(`クリックされたキャラクター: ${fileName}`);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const backgroundStyle = {
    backgroundImage: `url(${weatherAssets[weather]?.background})`,
  };
  
  const currentWeatherIcon = weatherAssets[weather]?.icon;

  return (
    <div className="app-container" style={backgroundStyle}>
      <div className="sky">
        {skyCharacters.map((char, index) => (
          <img
            key={`sky-${index}`}
            src={char.src}
            alt={`character-${index}`}
            className="character"
            style={char.style}
            onClick={() => handleCharacterClick(char)}
          />
        ))}
      </div>
      <div className="garden">
        {groundCharacters.map((char, index) => (
          <img
            key={`ground-${index}`}
            src={char.src}
            alt={`character-${index}`}
            className="character"
            style={char.style}
            onClick={() => handleCharacterClick(char)}
          />
        ))}
      </div>
      <div className="weather-info">
        {currentWeatherIcon && (
          <img src={currentWeatherIcon} alt={`${weather} icon`} className="weather-icon-display" />
        )}
        {weatherData && (
          <div className="location">{weatherData.name}</div>
        )}
      </div>

      <div className="menu-container">
        <div className="menu-button" onClick={toggleMenu}>
          <span className="menu-bar-line"></span>
          <span className="menu-bar-line"></span>
          <span className="menu-bar-line"></span>
        </div>

        {isMenuOpen && (
          <div className="menu-bar">
            <div className="menu-item">設定</div>
            <div className="menu-item">図鑑</div>
            <div className="menu-item">ヘルプ</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;