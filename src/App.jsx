import { useState, useEffect } from 'react';
import './App.css';
import { weatherAssets } from './utils/imageLoader';

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

const mapApiIconToWeatherType = (iconCode) => {
  const firstTwoChars = iconCode.slice(0, 2);
  if (firstTwoChars === '01') return 'sunny';
  if (['02', '03', '04', '50'].includes(firstTwoChars)) return 'cloudy';
  if (['09', '10', '11', '13'].includes(firstTwoChars)) return 'rainy';
  return 'sunny';
};

function App() {
  const [weatherType, setWeatherType] = useState('sunny');
  const [groundCharacters, setGroundCharacters] = useState([]);
  const [skyCharacters, setSkyCharacters] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [location, setLocation] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [capturedCharacter, setCapturedCharacter] = useState(null);
  const [respawnQueue, setRespawnQueue] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      () => {
        console.log("位置情報を取得できませんでした。");
        setLocation({ lat: 31.56028, lon: 130.55806 }); // 失敗時は鹿児島
      }
    );
  }, []);

  useEffect(() => {
    if (!location) return;
    const fetchAllWeatherData = async () => {
      try {
        const [weatherResponse, forecastResponse] = await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric&lang=ja`),
          fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric&lang=ja`)
        ]);
        if (!weatherResponse.ok || !forecastResponse.ok) throw new Error('APIからの応答がありません');
        const weatherJson = await weatherResponse.json();
        const forecastJson = await forecastResponse.json();
        setWeatherData(weatherJson);
        setForecastData(forecastJson);
      } catch (error) {
        console.error("天気情報の取得に失敗:", error);
      }
    };
    fetchAllWeatherData();
  }, [location]);

  useEffect(() => {
    if (!weatherData) return;
    const weatherMain = weatherData.weather[0].main;
    let newWeather = "rainy";
    if (weatherMain === "Clear") newWeather = "sunny";
    else if (weatherMain === "Clouds") newWeather = "cloudy";
    setWeatherType(newWeather);

    const assets = weatherAssets[newWeather];
    if (!assets) return;
    const groundOptions = { placementType: 'ground', horizontalRange: [15, 85] };
    const groundChars = placeCharactersWithoutOverlap(assets.characters.ground, 2, groundOptions);
    setGroundCharacters(groundChars);
    const skyOptions = { placementType: 'sky', horizontalRange: [15, 85] };
    const skyChars = placeCharactersWithoutOverlap(assets.characters.sky, 1, skyOptions);
    setSkyCharacters(skyChars);
    setRespawnQueue([]);
  }, [weatherData]);
  
  useEffect(() => {
    const respawnInterval = setInterval(() => {
      const now = Date.now();
      const MAX_CHARS = 3;
      const totalCharacters = groundCharacters.length + skyCharacters.length;
      if (totalCharacters < MAX_CHARS && respawnQueue.length > 0) {
        const respawnEvent = respawnQueue.find(item => item.respawnTime <= now);
        if (respawnEvent) {
          const assets = weatherAssets[weatherType];
          if (!assets) return;
          const type = respawnEvent.type;
          const onScreenSrcs = [...groundCharacters, ...skyCharacters].map(char => char.src);
          const potentialRespawns = (type === 'ground') ? assets.characters.ground : assets.characters.sky;
          const availableCharacters = potentialRespawns.filter(src => !onScreenSrcs.includes(src));
          if (availableCharacters.length === 0) {
            setRespawnQueue(prev => prev.filter(item => item.id !== respawnEvent.id));
            return;
          }
          const randomCharSrc = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
          const allCurrentCharacters = [...groundCharacters, ...skyCharacters];
          let newCharacter;
          let isOverlapping;
          let attempts = 0;
          const maxAttempts = 50;
          do {
            isOverlapping = false;
            const tempCharacterArray = placeCharactersWithoutOverlap([randomCharSrc], 1, {
              placementType: type,
              horizontalRange: [15, 85],
            });
            newCharacter = tempCharacterArray[0];
            for (const existingChar of allCurrentCharacters) {
              const newLeft = parseFloat(newCharacter.style.left);
              const existingLeft = parseFloat(existingChar.style.left);
              if (Math.abs(newLeft - existingLeft) < 15) { 
                isOverlapping = true;
                break;
              }
            }
            attempts++;
          } while (isOverlapping && attempts < maxAttempts);
          if (!isOverlapping) {
            if (type === 'ground') {
              setGroundCharacters(prev => [...prev, newCharacter]);
            } else {
              setSkyCharacters(prev => [...prev, newCharacter]);
            }
            setRespawnQueue(prev => prev.filter(item => item.id !== respawnEvent.id));
          }
        }
      }
    }, 1000);
    return () => clearInterval(respawnInterval);
  }, [respawnQueue, groundCharacters, skyCharacters, weatherType]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleCharacterClick = (character) => setCapturedCharacter(character);
  const closeModal = () => {
    if (!capturedCharacter) return;
    const RESPAWN_DELAY = 3 * 60 * 1000;
    const isGround = weatherAssets[weatherType].characters.ground.some(src => src === capturedCharacter.src);
    const type = isGround ? 'ground' : 'sky';
    setRespawnQueue(prevQueue => [...prevQueue, { id: Date.now(), respawnTime: Date.now() + RESPAWN_DELAY, type: type }]);
    setGroundCharacters(prev => prev.filter(char => char.src !== capturedCharacter.src));
    setSkyCharacters(prev => prev.filter(char => char.src !== capturedCharacter.src));
    setCapturedCharacter(null);
  };
  const openMenuModal = (menuName) => {
    setActiveMenu(menuName);
    setIsMenuOpen(false);
  };
  const closeMenuModal = () => setActiveMenu(null);
  const menuContent = {
    '天気': 'ここに天気の詳細情報（週間予報など）が表示されます。',
    '図鑑': 'ここにゲットしたキャラクターの一覧が表示されます。',
    'フレンド': 'ここにフレンドリストが表示されます。',
    '設定': 'ここに各種設定項目が表示されます。',
    'ヘルプ': 'ここにゲームの遊び方やお問い合わせ情報が表示されます。',
  };
  const backgroundStyle = { backgroundImage: `url(${weatherAssets[weatherType]?.background})` };
  const currentWeatherIcon = weatherAssets[weatherType]?.icon;

  return (
    <div className="app-container" style={backgroundStyle}>
      <div className="sky">
        {skyCharacters.map((char) => (
          <img key={`sky-${char.src}`} src={char.src} alt="character" className="character" style={char.style} onClick={() => handleCharacterClick(char)} />
        ))}
      </div>
      <div className="garden">
        {groundCharacters.map((char) => (
          <img key={`ground-${char.src}`} src={char.src} alt="character" className="character" style={char.style} onClick={() => handleCharacterClick(char)} />
        ))}
      </div>
      <div className="weather-info">
        <div className="current-weather">
          {currentWeatherIcon && <img src={currentWeatherIcon} alt={`${weatherType} icon`} className="weather-icon-display" />}
          {weatherData && <div className="location">{weatherData.name}</div>}
        </div>
        <div className="forecast-container">
          {forecastData && forecastData.list.slice(0, 3).map((forecast, index) => {
            const forecastWeatherType = mapApiIconToWeatherType(forecast.weather[0].icon);
            const forecastIconSrc = weatherAssets[forecastWeatherType]?.icon;
            return (
              <div key={index} className="forecast-item">
                <span className="forecast-time">{(index + 1) * 3}時間後</span>
                {forecastIconSrc && <img src={forecastIconSrc} alt="forecast icon" />}
              </div>
            );
          })}
        </div>
      </div>
      <div className="menu-container">
        <div className="menu-button" onClick={toggleMenu}>
          <span className="menu-bar-line"></span>
          <span className="menu-bar-line"></span>
          <span className="menu-bar-line"></span>
        </div>
        {isMenuOpen && (
          <div className="menu-bar">
            <div className="menu-item" onClick={() => openMenuModal('天気')}>天気</div>
            <div className="menu-item" onClick={() => openMenuModal('図鑑')}>図鑑</div>
            <div className="menu-item" onClick={() => openMenuModal('フレンド')}>フレンド</div>
            <div className="menu-item" onClick={() => openMenuModal('設定')}>設定</div>
            <div className="menu-item" onClick={() => openMenuModal('ヘルプ')}>ヘルプ</div>
          </div>
        )}
      </div>
      {capturedCharacter && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>キャラクターをゲット！</h2>
            <img src={capturedCharacter.src} alt="ゲットしたキャラクター" className="captured-character-image" />
            <p>{capturedCharacter.src.split('/').pop().replace(/\.\w+$/, '')}</p>
            <button onClick={closeModal}>閉じる</button>
          </div>
        </div>
      )}
      {activeMenu && (
        <div className="modal-overlay" onClick={closeMenuModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{activeMenu}</h2>
            {activeMenu === '天気' ? (
              <div className="weather-forecast-details">
                {forecastData ? forecastData.list.slice(0, 5).map((forecast, index) => {
                  const time = new Date(forecast.dt * 1000).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
                  const temp = Math.round(forecast.main.temp);
                  const forecastWeatherType = mapApiIconToWeatherType(forecast.weather[0].icon);
                  const forecastIconSrc = weatherAssets[forecastWeatherType]?.icon;
                  return (
                    <div key={index} className="forecast-detail-item">
                      <span className="forecast-detail-time">{time}</span>
                      {forecastIconSrc && <img src={forecastIconSrc} alt="forecast icon" />}
                      <span className="forecast-detail-temp">{temp}°C</span>
                    </div>
                  );
                }) : <p>予報データを読み込み中です...</p>}
              </div>
            ) : (
              <p className="menu-modal-content">{menuContent[activeMenu]}</p>
            )}
            <button onClick={closeMenuModal}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;