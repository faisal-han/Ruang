import { useEffect, useState } from 'react';

type Post = {
  id: string;
  content_cid: string;
  created_at: string;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    // Ambil data dari backend kita
    fetch('http://localhost:8080/posts')
      .then((res) => res.json())
      .then((data: Post[]) => setPosts(data))
      .catch((err) => console.error("Error fetching posts:", err));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Ruang Curhat</h1>
      {posts.map((post: Post) => (
        <div key={post.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
          <p><strong>CID IPFS:</strong> {post.content_cid}</p>
          <small>{new Date(post.created_at).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}