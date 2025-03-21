export interface IDevtoolsEvent {
  source: string;
  name: string;
  data: {
    captchaType: string;
    captchaName: string;
    params: any;
    params_v2: any;
  }
}

export interface IDetector {
  timestamp: Date;
  type: string;
  name: string;
  url: string;
  sitekey: string;
  params: string;
  params_v2: string;
}