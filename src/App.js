import Header from "./components/Header.tsx";
import Main from "./pages/Main/Main.tsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import SongList from "./pages/Song/SongList.tsx";
import CreateTag from "./pages/Tag/CreateTag.tsx";
import CreateSong from "./pages/Song/CreateSong.tsx";
import EmptyPage from "./pages/EmptyPage.tsx";
import TagList from "./pages/Tag/TagList.tsx";
import EditSong from "./pages/Song/EditSong.tsx";
import EditTag from "./pages/Tag/EditTag.tsx";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/song" element={<SongList />} />
          <Route path="/tag" element={<TagList />} />
          <Route path="/song/create" element={<CreateSong />} />
          <Route path="/tag/create" element={<CreateTag />} />
          <Route path="/song/edit/:song" element={<EditSong />} />
          <Route path="/tag/edit/:tag" element={<EditTag />} />
          <Route path="/*" element={<EmptyPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
