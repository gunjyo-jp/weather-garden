import { useState, useEffect } from 'react';
import './App.css';
import { weatherAssets } from './utils/imageLoader';
import infoUrban from './data';

const apiKey = import.meta.env.VITE_WEATHER_APP_KEY;
const url_users_db = "http://localhost:3001/user";
const url_creatures_db = "http://localhost:3001/creature";

// キャラクターを重ならないように配置
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
    if (placementType === 'ground') style.bottom = `${Math.random() * 15}%`;
    else style.top = `${Math.random() * 85}%`;
    return { src: char.src, style };
  });
};

// OpenWeatherMapアイコンから天気タイプを取得
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
  const [userInfo, setUserInfo] = useState(null);

  // 位置情報取得
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => setLocation({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => {
        console.log("位置情報を取得できませんでした。");
        setLocation({ lat: 31.56028, lon: 130.55806 });
      }
    );
  }, []);

  // 天気情報取得
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

  // キャラクター配置
  useEffect(() => {
    if (!weatherData) return;
    const weatherMain = weatherData.weather[0].main;
    let newWeather = "rainy";
    if (weatherMain === "Clear") newWeather = "sunny";
    else if (weatherMain === "Clouds") newWeather = "cloudy";
    setWeatherType(newWeather);

    const assets = weatherAssets[newWeather];
    if (!assets) return;

    const groundChars = placeCharactersWithoutOverlap(assets.characters.ground, 2, { placementType: 'ground', horizontalRange: [15, 85] });
    const skyChars = placeCharactersWithoutOverlap(assets.characters.sky, 1, { placementType: 'sky', horizontalRange: [15, 85] });
    setGroundCharacters(groundChars);
    setSkyCharacters(skyChars);
    setRespawnQueue([]);
  }, [weatherData]);

  // キャラクター再出現処理
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
            const tempCharacterArray = placeCharactersWithoutOverlap([randomCharSrc], 1, { placementType: type, horizontalRange: [15, 85] });
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
            if (type === 'ground') setGroundCharacters(prev => [...prev, newCharacter]);
            else setSkyCharacters(prev => [...prev, newCharacter]);
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
    const isGround = weatherAssets[weatherType].characters.ground.includes(capturedCharacter.src);
    const type = isGround ? 'ground' : 'sky';
    setRespawnQueue(prev => [...prev, { id: Date.now(), respawnTime: Date.now() + RESPAWN_DELAY, type }]);
    setGroundCharacters(prev => prev.filter(char => char.src !== capturedCharacter.src));
    setSkyCharacters(prev => prev.filter(char => char.src !== capturedCharacter.src));
    setCapturedCharacter(null);
  };
  const openMenuModal = (menuName) => { setActiveMenu(menuName); setIsMenuOpen(false); };
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

  // DB操作関数
  function fetchDb({ url, setState }) {
    fetch(url).then(res => res.json()).then(json => setState(json)).catch(err => console.error("GET Error:", err));
  }
  function addDb({ url, data, onSuccess }) {
    fetch(url, { method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" }, body: JSON.stringify(data) })
      .then(res => res.json()).then(json => { if (onSuccess) onSuccess(json); }).catch(err => console.error("POST Error:", err));
  }
  function updateDb({ url, id, data, onSuccess }) {
    fetch(`${url}/${id}`, { method: "PUT", headers: { "Accept": "application/json", "Content-Type": "application/json" }, body: JSON.stringify(data) })
      .then(res => res.json()).then(json => { if (onSuccess) onSuccess(json); }).catch(err => console.error("PUT Error:", err));
  }
  function deleteDb({ url, id, onSuccess }) {
    fetch(`${url}/${id}`, { method: "DELETE" }).then(() => { if (onSuccess) onSuccess(); }).catch(err => console.error("DELETE Error:", err));
  }

  // CRUDボタンコンポーネント
  function CrudTestButtons({ setUserInfo }) {
    const handleGet = () => fetchDb({ url: url_users_db, setState: setUserInfo });
    const handleAdd = () => {
      const newUser = { userid: Date.now(), username: "new_user_" + Math.floor(Math.random() * 100), friend: [], weather: "Clear", geted: [] };
      addDb({ url: url_users_db, data: newUser, onSuccess: () => fetchDb({ url: url_users_db, setState: setUserInfo }) });
    };
    const handleUpdate = () => {
      const targetId = prompt("更新したいユーザーのidを入力");
      const newName = prompt("新しいusernameを入力");
      if (!targetId || !newName) return;
      updateDb({ url: url_users_db, id: targetId, data: { username: newName }, onSuccess: () => fetchDb({ url: url_users_db, setState: setUserInfo }) });
    };
    const handleDelete = () => {
      const targetId = prompt("削除したいユーザーのidを入力");
      if (!targetId) return;
      deleteDb({ url: url_users_db, id: targetId, onSuccess: () => fetchDb({ url: url_users_db, setState: setUserInfo }) });
    };
    return (
      <div style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
        <button onClick={handleGet}>GET（取得）</button>
        <button onClick={handleAdd}>POST（追加）</button>
        <button onClick={handleUpdate}>PUT（更新）</button>
        <button onClick={handleDelete}>DELETE（削除）</button>
      </div>
    );
  }

  return (
    <>
      <CrudTestButtons setUserInfo={setUserInfo} />
      <pre>{JSON.stringify(userInfo, null, 2)}</pre>

      <div className="app-container" style={backgroundStyle}>
        {/* 空中エリア */}
        <div className="sky">
          {skyCharacters.map((char) => (
            <img key={`sky-${char.src}`} src={char.src} alt="character" className="character" style={char.style} onClick={() => handleCharacterClick(char)} />
          ))}
        </div>

        {/* 地面エリア */}
        <div className="garden">
          {groundCharacters.map((char) => (
            <img key={`ground-${char.src}`} src={char.src} alt="character" className="character" style={char.style} onClick={() => handleCharacterClick(char)} />
          ))}
        </div>

        {/* 天気情報 */}
        <div className="weather-info">
          {currentWeatherIcon && <img src={currentWeatherIcon} alt={`${weatherType} icon`} className="weather-icon-display" />}
          {weatherData && <div className="location">{weatherData.name}</div>}
        </div>
      </div>
    </>
  );
}

export default App;
