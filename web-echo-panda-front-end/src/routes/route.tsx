import { createBrowserRouter, Navigate } from "react-router-dom";
import HomeLayout from "../layouts/HomeLayout";
import AuthLayout from "../layouts/AuthLayout";
import { routeConfig } from "./routeConfig";

import AdminLayout from "../admin/AdminLayout";
import ProtectedAdminRoute from "../admin/ProtectedAdminRoute";
import Dashboard from "../admin/pages/Dashboard";
import Admins from "../admin/pages/Admins";
import Users from "../admin/pages/Users";
import Songs from "../admin/pages/Songs";
import Categories from "../admin/pages/Categories";
import Artists from "../admin/pages/Artists";
import Favorites from "../admin/pages/Favorites";
import Albums from "../admin/pages/Albums";
import AdminSettings from "../admin/pages/AdminSettings";
import AdminLogin from "../admin/pages/AdminLogin";
import AdminCategoryAlbums from "../admin/pages/CategoryAlbumsAdmin";
import Tags from "../admin/pages/Tags";
import TagAlbums from "../admin/pages/TagAlbums";

// Get main routes (menu, library, playlist, general) for HomeLayout
const mainRoutes = routeConfig.filter(
  (route) =>
    ["menu", "library", "playlist", "general", "other"].includes(route.group) &&
    route.component
);

// Get auth routes for AuthLayout
const authRoutes = routeConfig.filter(
  (route) => route.group === "auth" && route.component
);

const router = createBrowserRouter([
  // Auth routes first (so they match before HomeLayout catches everything)
  ...authRoutes.map((route) => ({
    path: route.path,
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: route.component ? <route.component /> : null,
      },
    ],
  })),
  // Home layout with main routes
  {
    path: "/",
    element: <HomeLayout />,
    children: mainRoutes.map((route) => ({
      path: route.path === "/" ? undefined : route.path,
      index: route.path === "/",
      element: route.component ? <route.component /> : null,
    })),
  },
  // Admin login route (no layout)
  {
    path: "/admin/login",
    element: <AdminLogin />,
  },
  // Admin routes with AdminLayout (Protected)
  {
    element: (
      <ProtectedAdminRoute>
        <AdminLayout />
      </ProtectedAdminRoute>
    ),
    children: [
      { path: "/admin", element: <Navigate to="/admin/dashboard" replace /> },
      { path: "/admin/dashboard", element: <Dashboard /> },
      { path: "/admin/admins", element: <Admins /> },
      { path: "/admin/users", element: <Users /> },
      { path: "/admin/songs", element: <Songs /> },
      { path: "/admin/categories", element: <Categories /> },
      { path: "/admin/artists", element: <Artists /> },
      { path: "/admin/favorites", element: <Favorites /> },
      { path: "/admin/albums", element: <Albums /> },
      { path: "/admin/settings", element: <AdminSettings /> },
      { path: "/admin/CategoryAlbum/:id", element: <AdminCategoryAlbums /> },
      { path: "/admin/tags", element: <Tags /> },
      { path: "/admin/tag-albums/:tagId", element: <TagAlbums /> }

    ],
  },
  
]);

export default router;

