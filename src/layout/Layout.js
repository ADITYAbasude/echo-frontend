import React from "react";
import {
  BottomNavigation,
  SideNavigation,
  Toast,
  TopNavigation,
} from "../components/index";
import { useRecoilState } from "recoil";
import { setVisible } from "../state/toastState";

const Layout = ({ children }) => {
  const [toastState, setToastState] = useRecoilState(setVisible);
  return (
    <div className="md:grid md:grid-cols-12 h-full dark:bg-background md:pr-[1rem]">
      <div className="col-span-2">
        <SideNavigation />
        <TopNavigation />
      </div>

      <main className="col-span-10 pt-16 max-md:pb-14">{children}</main>
      <Toast
        message={toastState.message}
        isVisible={toastState.visible}
        type={toastState.type}
        onClose={() =>
          setToastState({
            ...toastState,
            visible: false,
          })
        }
      />
      <BottomNavigation />
    </div>
  );
};

export default Layout;
