// 로그인 (Google OAuth + 이메일/비밀번호)
// 담당: D
import { signInWithGoogle, signInWithEmail } from '@/lib/firebase/auth';

export default function LoginPage() {
  // TODO: 폼 + 소셜 버튼 + 에러 핸들링
  void signInWithGoogle; void signInWithEmail;
  return (
    <div style={{ padding: 24 }}>
      <h1>로그인</h1>
      <p>구현 예정 — Google / 이메일 로그인</p>
    </div>
  );
}
