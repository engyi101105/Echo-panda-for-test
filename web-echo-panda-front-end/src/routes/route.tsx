import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import HomeLayout from "../layouts/HomeLayout";
import AuthLayout from "../layouts/AuthLayout";
import { routeConfig } from "./routeConfig";

import ArtistLayout from "../artist/ArtistLayout";
import ProtectedAdminRoute from "../artist/ProtectedAdminRoute";
import Dashboard from "../artist/pages/Dashboard";
import Users from "../artist/pages/Users";
import Songs from "../artist/pages/Songs";
import Categories from "../artist/pages/Categories";
import Artists from "../artist/pages/Artists";
import Favorites from "../artist/pages/Favorites";
import Albums from "../artist/pages/Albums";
import ArtistSettings from "../artist/pages/ArtistSettings";
import AdminCategoryAlbums from "../artist/pages/CategoryAlbumsAdmin";
import Tags from "../artist/pages/Tags";
import TagAlbums from "../artist/pages/TagAlbums";

function RedirectCategoryAlbum() {
  const { id } = useParams();
  return <Navigate to={`/artist/category-album/${id ?? ""}`} replace />;
}

function RedirectTagAlbums() {
  const { tagId } = useParams();
  return <Navigate to={`/artist/tag-albums/${tagId ?? ""}`} replace />;
}

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
  // Artist dashboard routes with ArtistLayout (Protected)
  {
    element: (
      <ProtectedAdminRoute>
        <ArtistLayout />
      </ProtectedAdminRoute>
    ),
    children: [
      { path: "/artist", element: <Navigate to="/artist/dashboard" replace /> },
      { path: "/artist/dashboard", element: <Dashboard /> },
      { path: "/artist/admins", element: <Navigate to="/artist/artists" replace /> },
      { path: "/artist/users", element: <Users /> },
      { path: "/artist/songs", element: <Songs /> },
      { path: "/artist/categories", element: <Categories /> },
      { path: "/artist/artists", element: <Artists /> },
      { path: "/artist/favorites", element: <Favorites /> },
      { path: "/artist/albums", element: <Albums /> },
      { path: "/artist/settings", element: <ArtistSettings /> },
      { path: "/artist/category-album/:id", element: <AdminCategoryAlbums /> },
      { path: "/artist/tags", element: <Tags /> },
      { path: "/artist/tag-albums/:tagId", element: <TagAlbums /> },

      { path: "/admin", element: <Navigate to="/artist/dashboard" replace /> },
      { path: "/admin/dashboard", element: <Navigate to="/artist/dashboard" replace /> },
      { path: "/admin/admins", element: <Navigate to="/artist/admins" replace /> },
      { path: "/admin/users", element: <Navigate to="/artist/users" replace /> },
      { path: "/admin/songs", element: <Navigate to="/artist/songs" replace /> },
      { path: "/admin/categories", element: <Navigate to="/artist/categories" replace /> },
      { path: "/admin/artists", element: <Navigate to="/artist/artists" replace /> },
      { path: "/admin/favorites", element: <Navigate to="/artist/favorites" replace /> },
      { path: "/admin/albums", element: <Navigate to="/artist/albums" replace /> },
      { path: "/admin/settings", element: <Navigate to="/artist/settings" replace /> },
      { path: "/admin/CategoryAlbum/:id", element: <RedirectCategoryAlbum /> },
      { path: "/admin/tags", element: <Navigate to="/artist/tags" replace /> },
      { path: "/admin/tag-albums/:tagId", element: <RedirectTagAlbums /> }

    ],
  },
  
]);

export default router;

