import { LuArrowRight, LuArrowLeft, LuCheck, LuChevronDown, LuSheet, LuFileText, LuLoaderCircle, LuUpload, LuLandmark, LuWallet, LuHouse, LuLayoutDashboard, LuBell, LuShield, LuLogOut, LuMenu, LuChevronUp, LuMail, LuCircleCheckBig, LuFolderOpen, LuSparkles, LuTarget, LuReceipt, LuChartColumn, LuRefreshCw, LuBuilding2, LuDownload, LuCrown } from "react-icons/lu";

const iconProps = { size: 16, strokeWidth: 2 };

export const IcoCheck = (props) => <LuCheck {...iconProps} {...props} />;
export const IcoChevron = ({ open, ...props }) => (
  <LuChevronDown
    {...iconProps}
    {...props}
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', ...(props.style || {}) }}
  />
);
export const IcoUpload = (props) => <LuUpload size={20} strokeWidth={1.9} {...props} />;
export const IcoSpinner = (props) => <LuLoaderCircle size={16} className="spinner" {...props} />;
export const IcoExcel = (props) => <LuSheet {...iconProps} {...props} />;
export const IcoPdf = (props) => <LuFileText {...iconProps} {...props} />;
export const IcoArrow = (props) => <LuArrowRight {...iconProps} {...props} />;
export const IcoBack = (props) => <LuArrowLeft {...iconProps} {...props} />;
export const IcoBank = (props) => <LuLandmark {...iconProps} {...props} />;
export const IcoWallet = (props) => <LuWallet {...iconProps} {...props} />;
export const IcoHome = (props) => <LuHouse {...iconProps} {...props} />;
export const IcoDashboard = (props) => <LuLayoutDashboard {...iconProps} {...props} />;
export const IcoBell = (props) => <LuBell {...iconProps} {...props} />;
export const IcoShield = (props) => <LuShield {...iconProps} {...props} />;
export const IcoLogout = (props) => <LuLogOut {...iconProps} {...props} />;
export const IcoMenu = (props) => <LuMenu {...iconProps} {...props} />;
export const IcoChevronUp = (props) => <LuChevronUp {...iconProps} {...props} />;
export const IcoMail = (props) => <LuMail {...iconProps} {...props} />;
export const IcoSuccess = (props) => <LuCircleCheckBig {...iconProps} {...props} />;
export const IcoFolder = (props) => <LuFolderOpen {...iconProps} {...props} />;
export const IcoSparkles = (props) => <LuSparkles {...iconProps} {...props} />;
export const IcoTarget = (props) => <LuTarget {...iconProps} {...props} />;
export const IcoReceipt = (props) => <LuReceipt {...iconProps} {...props} />;
export const IcoChart = (props) => <LuChartColumn {...iconProps} {...props} />;
export const IcoRefresh = (props) => <LuRefreshCw {...iconProps} {...props} />;
export const IcoBuilding = (props) => <LuBuilding2 {...iconProps} {...props} />;
export const IcoDownload = (props) => <LuDownload {...iconProps} {...props} />;
export const IcoCrown = (props) => <LuCrown {...iconProps} {...props} />;
