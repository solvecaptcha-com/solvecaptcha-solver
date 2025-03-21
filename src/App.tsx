import styles from './App.module.scss';
import { FC, useState } from 'react';
import logo from './assets/logo.svg';
import { IDetector, IDevtoolsEvent } from './types/detector.type';
import DetectorTable from "./DetectorTable/DetectorTable";

const App: FC = () => {
  const [detector, setDetector] = useState<IDetector[]>();

  const handleMessage = (event: IDevtoolsEvent) => {
    const message: IDetector = {
      timestamp: new Date(),
      type: event.data.captchaType,
      name: event.data.captchaName,
      url: event.data.params?.url || event.data.params?.pageurl,
      sitekey: event.data.params?.googlekey || event.data.params?.sitekey,
      params: JSON.stringify(event.data.params, null, 2),
      params_v2: JSON.stringify(event.data.params_v2, null, 2),
    };

    setDetector([
      message,
      ...(detector || []),
    ]);
  };

  const backgroundPageConnection = chrome.runtime.connect({
    name: 'panel'
  });

  backgroundPageConnection.postMessage({
    command: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId
  });

  backgroundPageConnection.onMessage.addListener((message: any) => {
    // Only accept messages of correct format (our messages)
    if (typeof message !== 'object' || message.command !== 'solvecaptcha-devtools') {
      return;
    }

    handleMessage(message);
  });

  const clearAll = () => {
    setDetector([]);
  };

  return (
    <>
      <img className={styles.logo} src={logo} width="250" alt="SolveCaptcha"/>
      {detector === undefined && <div className={styles.init}>if you want to get captcha info, please reload page.</div>}
      {detector && detector.length > 0 && <DetectorTable data={detector || []} clearAll={clearAll}/>}
    </>
  );
}
;

export default App;
