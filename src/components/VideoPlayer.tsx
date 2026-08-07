import { getVideoUri } from '../offline/video-cache';

// Dans votre composant :
const [videoSrc, setVideoSrc] = useState('');

useEffect(() => {
  getVideoUri(lesson.id, lesson.video_url).then(uri => {
    setVideoSrc(uri);
  });
}, [lesson]);