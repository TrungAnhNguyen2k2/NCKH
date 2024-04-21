import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import Dashboard from "./pages/Dashboard/index";
import socket from "./service/socket.js";

import "primeflex/primeflex.css";
import "primeicons/primeicons.css";
import "primereact/resources/primereact.css";
import "prismjs/themes/prism-coy.css";
import "./App.scss";
import "./assets/layout/layout.scss";
import PrivateRoute from "./components/PrivateRoute";
import Account from "./pages/Account";
import Detail from "./pages/Account/Detail";
import AnalystPost from "./pages/AnalystPost";
import CampaignFacebookManage from "./pages/CampaignFacebookManage";
import ExportReport from "./pages/ExportReport";
import FbAccountManage from "./pages/FbAccount";
import Login from "./pages/Login";
import ManagePost from "./pages/ManagePost";
import Notify from "./pages/Notify";
import ProfileManage from "./pages/Profile";
import DetailProfile from "./pages/Profile/Detail";
import Report from "./pages/Report";
import SourceManage from "./pages/SourceManage";
import TagManage from "./pages/Tag";
import UserManage from "./pages/Users";
import DetailHistory from "./pages/Users/Detail";
import Content from "./pages/ContentWordpress/index.jsx";
import { useSelector } from "react-redux";
import { Toast } from "primereact/toast";
import NotificationSound from "./assets/sounds/notification.wav";
const App = () => {
  const [displayDialog, setDisplayDialog] = useState(false);
  const notification = useRef(null);
  const audioPlayer = useRef(null);

  function playAudio() {
    if (!audioPlayer.current.paused || audioPlayer.current.currentTime) {
      console.log('current playing sound')
    } else {
      audioPlayer.current.loop = true;
      audioPlayer.current.play();
      setTimeout(() => {
        audioPlayer.current.loop = false;
        // audioPlayer.current.stop();
        audioPlayer.current.pause()
        audioPlayer.current.currentTime = 0
      }, 6000);
    }
  }
  const queryStr = useSelector((state) => state.query.queryStr);
  useEffect(() => {
    if (queryStr) {
      setDisplayDialog(true);
    } else {
      setDisplayDialog(false);
    }
  }, [queryStr]);


  const [ids, setIds] = useState([]);
  useEffect(() => {
    const onNotification = (data) => {
      // console.log('notification', data);
      notification.current.show({ severity: "info", summary: "Có bài viết mới", detail: data.detail });
      if ('Notification' in window && Notification.permission === "granted") {
        new Notification("Có bài viết mới", { body: data.detail });
      }
      playAudio();
      setIds(data.contentIds);
    }
    socket.on("notification", onNotification);
    // notification.current.show({ sticky:true, severity: "info", summary: "Thông báo", detail: "Có bài viết mới" });
    // setIds(["1", "2"]);
    return () => {
      socket.off('notification', onNotification);
    }
  }, []);

  return (
    <div>
      <Toast
        ref={notification}
        onClick={() => {
          console.log(ids);
        }}
      />
      <audio ref={audioPlayer} src={NotificationSound} />
      <Router>
        <Switch>
          <PrivateRoute path="/" exact component={Dashboard} />
          <PrivateRoute path="/du-lieu" exact component={SourceManage} />
          <PrivateRoute path="/chu-de" exact component={AnalystPost} />
          <PrivateRoute path="/bai-viet" exact component={ManagePost} />

          <PrivateRoute path="/chien-dich-facebook" exact component={CampaignFacebookManage} />
          <PrivateRoute path="/nguoi-dang" exact component={Account} />
          <PrivateRoute path="/nguoi-dang/:id" exact component={Detail} />

          <PrivateRoute path="/quan-ly-bai-viet-can-xu-ly" exact component={Report} />
          <PrivateRoute path="/nguoi-dung" exact component={UserManage} />
          <PrivateRoute path="/nguoi-dung/:id" exact component={DetailHistory} />

          <PrivateRoute path="/tag" exact component={TagManage} />
          <PrivateRoute path="/fb-account" exact component={FbAccountManage} />
          <PrivateRoute path="/ho-so" exact component={ProfileManage} />
          <PrivateRoute path="/ho-so/:id" exact component={DetailProfile} />
          <PrivateRoute path="/thong-bao" exact component={Notify} />
          <PrivateRoute path="/content" exact component={Content} />

          <PrivateRoute path="/bao-cao" exact component={ExportReport} />

          <Route path="/login" exact component={Login} />
        </Switch>
      </Router>
    </div>
  );
};

export default App;
