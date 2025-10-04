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

function App() {
  const [weatherType, setWeatherType] = useState('sunny');
  const [groundCharacters, setGroundCharacters] = useState([]);
  const [skyCharacters, setSkyCharacters] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [capturedCharacter, setCapturedCharacter] = useState(null);
  const [respawnQueue, setRespawnQueue] = useState([]);

  // useEffect 1: 位置情報と天気の初期取得
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=${apiKey}&units=metric&lang=ja`)
          .then(res => res.json())
          .then(json => {
            setWeatherData(json);
          });
      },
      () => {
        console.log("位置情報を取得できませんでした。");
        // 位置情報取得に失敗した場合、デフォルト（鹿児島）で天気を取得
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=31.56028&lon=130.55806&appid=${apiKey}&units=metric&lang=ja`)
          .then(res => res.json())
          .then(json => {
            setWeatherData(json);
          });
      }
    );
  }, []);

  // useEffect 2: 天気の変化に応じたキャラクターの初期配置
  useEffect(() => {
    if (!weatherData) return;
    const weatherMain = weatherData.weather[0].main;
    let newWeather = "rainy";

    if (weatherMain === "Clear") {
      newWeather = "sunny";
    } else if (weatherMain === "Clouds") {
      newWeather = "cloudy";
    }
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
  
  // useEffect 3: キャラクターの再出現を処理
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
    }, 1000); // 1秒ごとにチェック

    return () => clearInterval(respawnInterval);
  }, [respawnQueue, groundCharacters, skyCharacters, weatherType]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCharacterClick = (character) => {
    setCapturedCharacter(character);
  };

  const closeModal = () => {
    if (!capturedCharacter) return;
    const RESPAWN_DELAY = 1 * 10 * 1000;

    const isGround = weatherAssets[weatherType].characters.ground.some(src => src === capturedCharacter.src);
    const type = isGround ? 'ground' : 'sky';

    setRespawnQueue(prevQueue => [
      ...prevQueue,
      {
        id: Date.now(),
        respawnTime: Date.now() + RESPAWN_DELAY,
        type: type,
      },
    ]);

    setGroundCharacters(prev => prev.filter(char => char.src !== capturedCharacter.src));
    setSkyCharacters(prev => prev.filter(char => char.src !== capturedCharacter.src));

    setCapturedCharacter(null);
  };

  const backgroundStyle = {
    backgroundImage: `url(${weatherAssets[weatherType]?.background})`,
  };

  const currentWeatherIcon = weatherAssets[weatherType]?.icon;

  return (
    <div className="app-container" style={backgroundStyle}>
      <div className="sky">
        {skyCharacters.map((char, index) => (
          <img
            key={`sky-${index}-${char.style.left}`}
            src={char.src}
            alt="character"
            className="character"
            style={char.style}
            onClick={() => handleCharacterClick(char)}
          />
        ))}
      </div>
      <div className="garden">
        {groundCharacters.map((char, index) => (
          <img
            key={`ground-${index}-${char.style.left}`}
            src={char.src}
            alt="character"
            className="character"
            style={char.style}
            onClick={() => handleCharacterClick(char)}
          />
        ))}
      </div>
      <div className="weather-info">
        {currentWeatherIcon && (
          <img src={currentWeatherIcon} alt={`${weatherType} icon`} className="weather-icon-display" />
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

      {capturedCharacter && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>キャラクターをゲット！</h2>
            <img 
              src={capturedCharacter.src} 
              alt="ゲットしたキャラクター" 
              className="captured-character-image"
            />
            <p>{capturedCharacter.src.split('/').pop().replace(/\.\w+$/, '')}</p>
            <button onClick={closeModal}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;