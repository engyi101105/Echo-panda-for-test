import {
  FaHome,
  FaRegHeart,
  FaUserFriends,
  FaRegClock,
  FaChartLine,
  FaCog,
} from "react-icons/fa";
import { IoMdDisc } from "react-icons/io";
import { RiPlayListFill } from "react-icons/ri";
import { MdOutlineExplore } from "react-icons/md";
import Home from "../pages/Home";
import Modify from "../pages/Modify";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Alibum from "../pages/Alibum";
import Discover from "../pages/Discover";
import Profile from "../pages/Profile";
import Artist from "../pages/Artist";
import ArtistsList from "../pages/ArtistsList";
import AboutUs from "../pages/AboutUs";
import RecentlyAdded from "../pages/RecentlyAdded";
import MostPlayed from "../pages/MostPlayed";
import FavoritesPage from "../pages/Favorites";
import ContactUs from "../pages/ContactUs";
import SongSection from "../pages/home/Songs";
import SongDetails from "../components/SongDetail";
import AlbumDetails from "../pages/Album/AlbumDetails";
import SearchPage from "../pages/SearchPage";
import Playlist from "../pages/Playlist";
import Settings from "../pages/Settings";
import CategoryAlbums from "../pages/CategoryAlbums";

// Admin 
import { Navigate } from "react-router-dom";
import AdminLayout from "../admin/AdminLayout";
import Dashboard from "../admin/pages/Dashboard";
import Admins from "../admin/pages/Admins";
import Users from "../admin/pages/Users";
import Favorites from "../admin/pages/Favorites";
import Artists from "../admin/pages/Artists";
import Songs from "../admin/pages/Songs";
import Categories from "../admin/pages/Categories";
import Albums from "../admin/pages/Albums";
import AdminSettings from "../admin/pages/AdminSettings";
import AdminLogin from "../admin/pages/AdminLogin";
import AdminCategoryAlbums from "../admin/pages/CategoryAlbumsAdmin";

export interface RouteConfig {
  path: string;
  label: string;
  icon: React.ElementType | null;
  component?: React.ComponentType<any>;
  group: "menu" | "library" | "playlist" | "general" | "auth" | "other" | "admin";
  requiresAuth?: boolean;
  showInSidebar?: boolean;
  role?: "admin" | "user"; 
  layout?: React.ComponentType<any>; 
}
const injectProps = (Component: React.ComponentType<any>, props: any) => {
  return () => <Component {...props} />;
};
export const routeConfig: RouteConfig[] = [
  // Main menu routes
  {
    path: "/",
    label: "Home",
    icon: FaHome,
    component: Home,
    group: "menu",
    showInSidebar: true,
  },
  {
    path: "/discover",
    label: "Discover",
    icon: MdOutlineExplore,
    component: Discover,
    group: "menu",
    showInSidebar: true,
  },
  {
    path: "/albums",
    label: "Albums",
    icon: IoMdDisc,
    component: Alibum,
    group: "menu",
    showInSidebar: true,
  },
  {
    path: "/artist/:id",
    label: "Artist Details",
    icon: null,
    component: Artist,
    group: "menu",
    showInSidebar: false,
  },
  {
    path: "/artist",
    label: "Artists",
    icon: FaUserFriends,
    component: ArtistsList,
    group: "menu",
    showInSidebar: true,
  },
  {
    path: "/category/:id",
    label: "Category Albums",
    icon: null,
    component: CategoryAlbums,
    group: "menu",
    showInSidebar: false,
  },


  {
    path: "/recently-added",
    label: "Recently Added",
    icon: FaRegClock,
    component: RecentlyAdded,
    group: "library",
    showInSidebar: true,
  },
  {
    path: "/most-played",
    label: "Most Played",
    icon: FaChartLine,
    component: MostPlayed,
    group: "library",
    showInSidebar: true,
  },

  // Playlist routes
  {
    path: "/favorites",
    label: "Your Favorites",
    icon: FaRegHeart,
    component: FavoritesPage,
    group: "playlist",
    showInSidebar: true,
  },
  {
    path: "/playlist",
    label: "Your Playlist",
    icon: RiPlayListFill,
    component: Playlist,
    group: "playlist",
    showInSidebar: true,
  },

  {
    path: "/settings",
    label: "Settings",
    icon: FaCog,
    component: Settings,
    group: "general",
    showInSidebar: true,
  },
  {
    path: "/modify",
    label: "Modify",
    icon: FaCog,
    component: Modify,
    group: "other",
    showInSidebar: false,
  },
  {
    path: "/profile",
    label: "Profile",
    icon: FaUserFriends,
    component: Profile,
    group: "general",
    showInSidebar: false,
  },
  {
    path: "/aboutUs",
    label: "AboutUs",
    group: "general",
    component: AboutUs,
    showInSidebar: false,
    icon: null,
  },
  {
    path: "/ContactUs",
    label: "Contact Us",
    component: ContactUs,
    group: "general",
    showInSidebar: false,
    icon: null,
  },

  // Auth routes
  {
    path: "/login",
    label: "Login",
    icon: FaHome,
    component: Login,
    group: "auth",
    showInSidebar: false,
  },
  {
    path: "/register",
    label: "Register",
    icon: FaHome,
    component: Register,
    group: "auth",
    showInSidebar: false,
  },
  {
    path: "/Songs",
    label: "Songs",
    component: SongSection,
    group: "general",
    showInSidebar: false,
    icon: null,
  },
  {
    path: "/song/:id",
    label: "Song Detail",
    component: SongDetails,
    group: "other",
    showInSidebar: false,
    icon: null,
  },
  {
    path: "/album/:id",
    label: "Album Detail",
    component: AlbumDetails,
    group: "other",
    showInSidebar: false,
    icon: null,
  },
{
  path: "/search",
  label: "Search",
  component: injectProps(SearchPage, { isLightMode: true }),
  group: "other",
  showInSidebar: false,
  icon: null,
},

// Admin routes 
{
  path: "/admin",
  label: "Admin shortcut",
  icon: null,
  component: () => <Navigate to="/admin/dashboard" replace />,
  group: "admin",
  showInSidebar: false,
  role: "admin",
},
{
  path: "/admin/login",
  label: "admin login",
  icon: null,
  component: AdminLogin,
  group: "admin",
  showInSidebar: false,
  role: "admin",
},
{
  path: "/admin/dashboard",
  label: "Dashboard",
  icon: null,
  component: Dashboard,
  layout: AdminLayout,
  group: "admin",
  showInSidebar: false, 
  role: "admin",
},
{
  path: "/admin/admins",
  label: "Admins",
  icon: null,
  component: Admins,
  layout: AdminLayout,
  group: "admin",
  showInSidebar: false,
  role: "admin",
},
{
  path: "/admin/users",
  label: "Users",
  icon: null,
  component: Users,
  layout: AdminLayout,
  group: "admin",
  showInSidebar: false,
  role: "admin",
},
{
  path: "/admin/favorites",
  label: "Favorites",
  icon: null,
  component: Favorites,
  layout: AdminLayout,
  group: "admin",
  showInSidebar: false,
  role: "admin",
},
{
  path: "/admin/artists",
  label: "Artists",
  icon: null,
  component: Artists,
  layout: AdminLayout,
  group: "admin",
  showInSidebar: false,
  role: "admin",
},
{
  path: "/admin/songs",
  label: "Songs",
  icon: null,
  component: Songs,
  layout: AdminLayout,
  group: "admin",
  showInSidebar: false,
  role: "admin",
},
{
  path: "/admin/categories",
  label: "Categories",
  icon: null,
  component: Categories,
  layout: AdminLayout,
  group: "admin",
  showInSidebar: false,
  role: "admin",
},
{
  path: "/admin/CategoryAlbum/:id",
  label: "Category Albums",
  icon: null,
  component: AdminCategoryAlbums,
  layout: AdminLayout,
  group: "admin",
  showInSidebar: false,
  role: "admin",
},
{
  path: "/admin/playlists-report",
  label: "Playlists Report",
  icon: null,
  component: Albums,
  layout: AdminLayout,
  group: "admin",
  showInSidebar: false,
  role: "admin",
},
{
  path: "/admin/settings",
  label: "Admin Settings",
  icon: FaCog,
  component: AdminSettings,
  layout: AdminLayout,
  group: "admin",
  showInSidebar: false,
  role: "admin",
},

]

export const getSidebarLinks = (): RouteConfig[] => {
  return routeConfig.filter(
    (route) => route.showInSidebar === true && route.group !== "admin"
  );
};

export const getAdminSidebarLinks = (): RouteConfig[] => {
  return routeConfig.filter(
    (route) => route.showInSidebar === true && route.group === "admin"
  );
};


// Helper function to get routes by group
export const getRoutesByGroup = (
  group: RouteConfig["group"]
): RouteConfig[] => {
  return routeConfig.filter(
    (route) => route.group === group && route.showInSidebar === true
  );
};
