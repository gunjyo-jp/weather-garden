import { useState, useEffect } from 'react';
import './App.css';
import { weatherAssets } from './utils/imageLoader';

const apiKey = import.meta.env.VITE_WEATHER_APP_KEY;
const url_users_db = "https://json-server-j4ce.onrender.com/user";
const url_creatures_db = "https://json-server-j4ce.onrender.com/creature";

//配置処理：生き物データをDBから受け取り、位置とstyleを追加
const placeCharactersWithoutOverlap = (creatures, count, options = {}) => {
  const { placementType = 'ground', horizontalRange = [0, 100] } = options;
  if (!creatures || creatures.length === 0) return [];

  const placed = [];
  const characterWidth = 15;
  const maxAttempts = 50;
  const selected = [...creatures].sort(() => 0.5 - Math.random()).slice(0, count);
  const minLeft = horizontalRange[0];
  const maxLeft = horizontalRange[1];
  const availableWidth = maxLeft - minLeft - characterWidth;

  for (const creature of selected) {
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
    placed.push({ ...position, creature });
  }

  return placed.map(char => {
    const style = {
      left: `${char.left}%`,
      transform: `scale(${Math.random() * 0.5 + 3})`,
    };
    if (placementType === 'ground') {
      style.bottom = `${Math.random() * 15}%`;
    } else {
      style.top = `${Math.random() * 85}%`;
    }
    return { ...char.creature, style };
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
  const [userInfo, setUserInfo] = useState({});
  const [creatures, setCreatures] = useState([]);

  // ▼ 位置情報取得とユーザー情報ロード
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => setLocation({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => {
        console.log("位置情報を取得できません。デフォルト(鹿児島)を使用します。");
        setLocation({ lat: 31.56028, lon: 130.55806 });
      }
    );

    fetch(`${url_users_db}/1`)
      .then(res => res.json())
      .then(json => setUserInfo(json))
      .catch(err => console.error("User GET error:", err));
  }, []);

  // ▼ 天気API取得
  useEffect(() => {
    if (!location) return;
    const fetchAllWeatherData = async () => {
      try {
        const [weatherResponse, forecastResponse] = await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric&lang=ja`),
          fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric&lang=ja`)
        ]);
        if (!weatherResponse.ok || !forecastResponse.ok) throw new Error('APIエラー');
        setWeatherData(await weatherResponse.json());
        setForecastData(await forecastResponse.json());
      } catch (error) {
        console.error("天気情報取得失敗:", error);
      }
    };
    fetchAllWeatherData();
  }, [location]);

  // ▼ Creature DB初回ロード
  useEffect(() => {
    fetch(url_creatures_db)
      .then(res => res.json())
      .then(json => setCreatures(json))
      .catch(err => console.error("Creature DB error:", err));
  }, []);

  // ▼ 天気変化で生き物再配置
  useEffect(() => {
    if (!weatherData || creatures.length === 0) return;

    const weatherMain = weatherData.weather[0].main;
    let newWeather = "rainy";
    if (weatherMain === "Clear") newWeather = "sunny";
    else if (weatherMain === "Clouds") newWeather = "cloudy";
    setWeatherType(newWeather);

    const groundPool = creatures.filter(c => {
      if (newWeather === 'sunny') return c.img.includes('sunny');
      if (newWeather === 'cloudy' || newWeather === 'rainy') return c.img.includes('cloudy_rainy');
      return false;
    });
    setGroundCharacters(placeCharactersWithoutOverlap(groundPool, 2, { placementType: 'ground', horizontalRange: [15, 85] }));
    setSkyCharacters([]);
    setRespawnQueue([]);
  }, [weatherData, creatures]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // ▼ キャラクター取得
  const handleCharacterClick = async (character) => {
    setCapturedCharacter(character);
    const creatureId = Number(character.id);

    try {
      // 最新ユーザー情報を取得
      const res = await fetch(`${url_users_db}/${userInfo.id}`);
      const latestUser = await res.json();

      // 重複なしで geted 更新
      const updatedGeted = Array.from(new Set([...(latestUser.geted || []), creatureId]));

      if (!latestUser.geted?.includes(creatureId)) {
        const patchRes = await fetch(`${url_users_db}/${userInfo.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ geted: updatedGeted }),
        });
        const updated = await patchRes.json();
        setUserInfo(updated);
      }
    } catch (err) {
      console.error("User update error:", err);
    }
  };

  // ▼ キャラ取得モーダルを閉じると再出現予約
  const closeModal = () => {
    if (!capturedCharacter) return;
    const RESPAWN_DELAY = 0.1 * 60 * 1000; // 6秒

    setGroundCharacters(prev => prev.filter(char => char.id !== capturedCharacter.id));
    setSkyCharacters(prev => prev.filter(char => char.id !== capturedCharacter.id));

    setRespawnQueue(prev => [...prev, {
      id: Date.now(),
      creatureId: capturedCharacter.id,
      respawnTime: Date.now() + RESPAWN_DELAY,
      type: 'ground'
    }]);

    setCapturedCharacter(null);
  };

  // ▼ リスポーンチェック


  // ▼ リスポーンチェック（修正版）
  useEffect(() => {
    if (respawnQueue.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setRespawnQueue(prevQueue => {
        const readyToRespawn = prevQueue.filter(item => item.respawnTime <= now);
        const stillWaiting = prevQueue.filter(item => item.respawnTime > now);
        const scale = Math.random() * 0.5 + 3; // 0.8〜1.3
        const flip = Math.random() < 0.5 ? -1 : 1; // 50%の確率で反

        if (readyToRespawn.length > 0) {
          setGroundCharacters(prevChars => {
            const respawned = readyToRespawn
              .filter(item => !prevChars.some(c => c.id === item.creatureId)) // ← ここで重複防止
              .map(item => {
                const original = creatures.find(c => c.id === item.creatureId);
                if (!original) return null;
                const style = {
                  left: `${Math.random() * 70 + 15}%`,
                  bottom: `${Math.random() * 15}%`,
                  transform: `scale(${scale*flip},${scale})`
                };
                return { ...original, style };
              })
              .filter(Boolean);
            return [...prevChars, ...respawned];
          });
        }

        return stillWaiting;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [respawnQueue, creatures]);


  const openMenuModal = (menuName) => {
    setActiveMenu(menuName);
    setIsMenuOpen(false);
  };
  const closeMenuModal = () => setActiveMenu(null);

  const backgroundStyle = { backgroundImage: `url(${weatherAssets[weatherType]?.background})` };
  const currentWeatherIcon = weatherAssets[weatherType]?.icon;

  const changeWeatherDemo = (newWeather) => {
    setWeatherType(newWeather);

    // 天気に合わせて groundCharacters を更新
    const groundPool = creatures.filter(c => {
      if (newWeather === 'sunny') return c.img.includes('sunny');
      if (newWeather === 'cloudy' || newWeather === 'rainy') return c.img.includes('cloudy_rainy');
      return false;
    });

    setGroundCharacters(placeCharactersWithoutOverlap(groundPool, 2, { placementType: 'ground', horizontalRange: [15, 85] }));
    setSkyCharacters([]); // 今はskyキャラ未対応
    setRespawnQueue([]);
  };


  const renderModalContent = () => {
    switch (activeMenu) {
      case '天気':
        return (
          <div className="weather-forecast-details">
            {forecastData ? forecastData.list.slice(0, 5).map((f, i) => {
              const time = new Date(f.dt * 1000).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
              const temp = Math.round(f.main.temp);
              const type = mapApiIconToWeatherType(f.weather[0].icon);
              return (
                <div key={i} className="forecast-detail-item">
                  <span className="forecast-detail-time">{time}</span>
                  {weatherAssets[type]?.icon && <img src={weatherAssets[type].icon} alt="icon" />}
                  <span className="forecast-detail-temp">{temp}°C</span>
                </div>
              );
            }) : <p>予報データを読み込み中...</p>}
          </div>
        );
      case '図鑑':
        if (!userInfo || !creatures) return <p>読み込み中...</p>;
        const ownedCreatures = creatures.filter(c => userInfo.geted?.includes(Number(c.id)));
        return (
          <div className="zukan-container">
            <h3>{userInfo.username}の図鑑</h3>
            {ownedCreatures.length > 0 ? (
              <div className="creature-list-scroll">
                {ownedCreatures.map(c => (
                  <div key={c.id} className="creature-card">
                    <img src={c.img} alt={c.creaturename} className="creature-img" />
                    <div className="creature-info">
                      <h4>{c.creaturename}</h4>
                      <p>{c.description || "不明"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p>まだ仲間がいません！</p>}
          </div>

        );
      case 'フレンド':
        return <div><h3>フレンド</h3><p>今後ここに実装予定</p></div>;
      case '設定':
        return <div><h3>設定</h3><p>音量・通知・テーマなど</p></div>;
      case 'ヘルプ':
        return <div><h3>ヘルプ</h3><p>使い方や問い合わせ先</p></div>;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="weather-demo-buttons">
        <button onClick={() => changeWeatherDemo('sunny')}>晴れ</button>
        <button onClick={() => changeWeatherDemo('cloudy')}>曇り</button>
        <button onClick={() => changeWeatherDemo('rainy')}>雨</button>
      </div>

      <div className="app-container" style={backgroundStyle}>
        <div className="sky">
          {skyCharacters.map(char => (
            <img key={`sky-${char.id}`} src={char.img} alt={char.creaturename} className="character" style={char.style} onClick={() => handleCharacterClick(char)} />
          ))}
        </div>

        <div className="garden">
          {groundCharacters.map(char => (
            <img key={`ground-${char.id}`} src={char.img} alt={char.creaturename} className="character" style={char.style} onClick={() => handleCharacterClick(char)} />
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
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>{capturedCharacter.creaturename}をゲット！</h2>
              <img src={capturedCharacter.img} alt={capturedCharacter.creaturename} className="captured-character-image" />
              <p>{capturedCharacter.description}</p>
              <button onClick={closeModal}>閉じる</button>
            </div>
          </div>
        )}

        {activeMenu && (
          <div className="modal-overlay" onClick={closeMenuModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>{activeMenu}</h2>
              {renderModalContent()}
              <button onClick={closeMenuModal}>閉じる</button>
            </div>
          </div>
        )}
      </div>


    </>

  );
}

export default App;
