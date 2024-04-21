import classNames from "classnames"
import {AppMenu} from "../../AppMenu"
import {AppTopbar} from "../../AppTopbar"
import DialogDetailContent from "../DialogDetailContent"
import React, {useEffect, useRef, useState} from "react"

import {useHistory, useLocation} from "react-router-dom"
import PrimeReact from "primereact/api"
import {Sidebar} from "primereact/sidebar"
import {CSSTransition} from "react-transition-group"
import {Tooltip} from "primereact/tooltip"
import {OverlayPanel} from "primereact/overlaypanel"
import {useDispatch, useSelector} from "react-redux"
import {logout} from "../../store/userStore"
import {useTranslation} from "react-i18next"
const LayoutAdmin = ({children}) => {
  const {t} = useTranslation()
  const dispatch = useDispatch()
  const [displayDialog, setDisplayDialog] = useState(false)
  const [sidebar, setSidebar] = useState(false)
  const [mobileTopbarMenuActive, setMobileTopbarMenuActive] = useState(false)
  const [layoutMode, setLayoutMode] = useState("static")
  const [layoutColorMode, setLayoutColorMode] = useState("light")
  const [inputStyle, setInputStyle] = useState("outlined")
  const [ripple, setRipple] = useState(true)
  const [staticMenuInactive, setStaticMenuInactive] = useState(false)
  const [overlayMenuActive, setOverlayMenuActive] = useState(false)
  const [mobileMenuActive, setMobileMenuActive] = useState(false)
  const op = useRef()
  const history = useHistory()
  const queryStr = useSelector((state) => state.query.queryStr)
  useEffect(() => {
    if (queryStr) {
      setTimeout(() => {
        setDisplayDialog(true)
      }, 300)
    } else {
      setDisplayDialog(false)
    }
  }, [queryStr])
  const copyTooltipRef = useRef()
  const location = useLocation()

  PrimeReact.ripple = true

  let menuClick = false
  let mobileTopbarMenuClick = false

  useEffect(() => {
    if (mobileMenuActive) {
      addClass(document.body, "body-overflow-hidden")
    } else {
      removeClass(document.body, "body-overflow-hidden")
    }
  }, [mobileMenuActive])

  useEffect(() => {
    copyTooltipRef && copyTooltipRef.current && copyTooltipRef.current.updateTargetEvents()
  }, [location])

  const isDesktop = () => {
    return window.innerWidth >= 992
  }

  const menu = [
    {
      label: "Menu",
      icon: "pi pi-fw pi-sitemap",
      items: [
        {label: "Dashboard", icon: "pi pi-fw pi-home", to: "/"},
        {label: "Chủ đề", icon: "pi pi-folder", to: "/chu-de"},
        {label: "Nguồn dữ liệu", icon: "pi pi-code", to: "/du-lieu"},
        {label: "Bài viết", icon: "pi pi-fw pi-bookmark", to: "/bai-viet"},
        // {label: "Hồ sơ đối tượng", icon: "pi pi-users", to: "/nguoi-dang"},
        // {label: "Quản lý bài viết cần xử lý", icon: "pi pi-exclamation-circle", to: "/quan-ly-bai-viet-can-xu-ly"},
        // {label: "Chiến dịch facebook", icon: "pi pi-play", to: "/chien-dich-facebook"},
        {label: "Thẻ", icon: "pi pi-hashtag", to: "/tag"},
        // {label: "Hồ sơ vụ việc", icon: "pi pi-book", to: "/ho-so"},
        // {label: "Báo cáo", icon: "pi pi-download", to: "/bao-cao"},
        {label: "Facebook Account", icon: "pi pi-facebook", to: "/fb-account"},
        {label: "Setting thông báo", icon: "pi pi-send", to: "/thong-bao"},
        // {label: "Trang thu thập thông tin", icon: "pi pi-align-justify", to: "/content"},
        {label: "Người dùng", icon: "pi pi-user", to: "/nguoi-dung"},
      ],
    },
  ]

  const addClass = (element, className) => {
    if (element.classList) element.classList.add(className)
    else element.className += " " + className
  }

  const removeClass = (element, className) => {
    if (element.classList) element.classList.remove(className)
    else
      element.className = element.className.replace(
        new RegExp("(^|\\b)" + className.split(" ").join("|") + "(\\b|$)", "gi"),
        " ",
      )
  }

  const wrapperClass = classNames("layout-wrapper", {
    "layout-overlay": layoutMode === "overlay",
    "layout-static": layoutMode === "static",
    "layout-static-sidebar-inactive": staticMenuInactive && layoutMode === "static",
    "layout-overlay-sidebar-active": overlayMenuActive && layoutMode === "overlay",
    "layout-mobile-sidebar-active": mobileMenuActive,
    "p-input-filled": inputStyle === "filled",
    "p-ripple-disabled": ripple === false,
    "layout-theme-light": layoutColorMode === "light",
  })
  const onWrapperClick = (event) => {
    if (!menuClick) {
      setOverlayMenuActive(false)
      setMobileMenuActive(false)
    }

    if (!mobileTopbarMenuClick) {
      setMobileTopbarMenuActive(false)
    }

    mobileTopbarMenuClick = false
    menuClick = false
  }

  const onToggleMenuClick = (event) => {
    menuClick = true

    if (isDesktop()) {
      if (layoutMode === "overlay") {
        if (mobileMenuActive === true) {
          setOverlayMenuActive(true)
        }

        setOverlayMenuActive((prevState) => !prevState)
        setMobileMenuActive(false)
      } else if (layoutMode === "static") {
        setStaticMenuInactive((prevState) => !prevState)
      }
    } else {
      setMobileMenuActive((prevState) => !prevState)
    }

    event.preventDefault()
  }

  const onSidebarClick = () => {
    menuClick = true
  }

  const onMobileTopbarMenuClick = (event) => {
    mobileTopbarMenuClick = true

    setMobileTopbarMenuActive((prevState) => !prevState)
    event.preventDefault()
  }

  const onMobileSubTopbarMenuClick = (event) => {
    mobileTopbarMenuClick = true
    setSidebar(true)

    event.preventDefault()
  }

  const onMenuItemClick = (event) => {
    if (!event.item.items) {
      setOverlayMenuActive(false)
      setMobileMenuActive(false)
    }
  }
  const onPopupUserLogout = (e) => {
    op.current.toggle(e)
  }
  const handleLogout = async () => {
    dispatch(logout())
    history.push({
      pathname: "/login",
    })
  }
  return (
    <div className={wrapperClass} onClick={onWrapperClick}>
      <DialogDetailContent id={queryStr} displayDialog={displayDialog} closeDialog={() => setDisplayDialog(false)} />
      <Tooltip
        ref={copyTooltipRef}
        target=".block-action-copy"
        position="bottom"
        content="Copied to clipboard"
        event="focus"
      />
      <OverlayPanel ref={op}>
        <ul className="list-none p-0 m-0">
          <li>
            <button className="p-link layout-topbar-button gap-2 flex" onClick={handleLogout}>
              <i className="pi pi-sign-out" />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </OverlayPanel>
      <AppTopbar
        onToggleMenuClick={onToggleMenuClick}
        layoutColorMode={layoutColorMode}
        onPopupUserLogout={onPopupUserLogout}
        mobileTopbarMenuActive={mobileTopbarMenuActive}
        onMobileTopbarMenuClick={onMobileTopbarMenuClick}
        onMobileSubTopbarMenuClick={onMobileSubTopbarMenuClick}
      />

      <div className="layout-sidebar" onClick={onSidebarClick}>
        <AppMenu model={menu} onMenuItemClick={onMenuItemClick} layoutColorMode={layoutColorMode} />
      </div>

      <div className="layout-main-container">
        <div className="layout-main">{children && children}</div>
      </div>
      <Sidebar visible={sidebar} className="p-sidebar-md" position="right" onHide={() => setSidebar(false)}>
        Content
      </Sidebar>

      <CSSTransition classNames="layout-mask" timeout={{enter: 200, exit: 200}} in={mobileMenuActive} unmountOnExit>
        <div className="layout-mask p-component-overlay"></div>
      </CSSTransition>
    </div>
  )
}

export default LayoutAdmin
