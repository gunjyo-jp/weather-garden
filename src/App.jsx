import { useState,useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import infoUrban from './data'

const user =[
  {lat: 31.56028, lon: 130.55806}
]


function App() {
  const [count, setCount] = useState(0)
  



  //初期描画の時に現在位置の取得を行う
  useEffect(()=>{
    navigator.geolocation.getCurrentPosition((position) => {
      user.lat = position.coords.latitude;
      user.lon = position.coords.longitude;
      console.log(user.lon,user.lat);
    
  },()=>{
      console.log("位置情報を取得できませんでした。");
  });


  },[])

  return (
    <>
     
    </>
  )
}

export default App
