import LoginGoogle from "@/components/LoginGoogle";
import Image from "next/image";
import Link from "next/link";
import styles from "./Login.module.scss";

interface LoginProps {
  identifier: string;
  setIdentifier: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string | null;
  handleLogin: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function Login({
  identifier,
  setIdentifier,
  password,
  setPassword,
  error,
  handleLogin,
  handleKeyDown,
}: LoginProps) {
  return (
    <div className={`flex min-h-[80vh] items-center justify-center ${styles.container}`}>
      <div className={styles.wrapper}>
        <div className={`mb-4 rounded p-8 ${styles.form}`}>
          <div className={styles.badge}>HAKO</div>
          <div
            className="mb-8 flex justify-center"
            style={{ userSelect: "none", pointerEvents: "none" }}
          >
            <Image
              src="/Images/logoLogin.png"
              alt="HAKO"
              width={175}
              height={51}
              priority
            />
          </div>

          <p className={styles.subtitle}>
            Chào mừng quay lại. Đăng nhập để tiếp tục trò chuyện, chia sẻ và theo dõi cộng đồng trên HAKO.
          </p>

          <div className={styles.formStack}>
            <div>
              <input
                type="text"
                placeholder="Số điện thoại, tên người dùng hoặc email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={styles.input}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                onKeyDown={handleKeyDown}
              />
            </div>

            <button onClick={handleLogin} className={styles.submitButton}>
              Đăng nhập
            </button>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.divider}>
              <div className={styles.dividerLine}></div>
              <span className={styles.dividerText}>HOẶC</span>
              <div className={styles.dividerLine}></div>
            </div>

            <LoginGoogle mode="signin" />

            <div className="text-center">
              <a href="#" className={styles.secondaryLink}>
                Quên mật khẩu?
              </a>
            </div>
          </div>
        </div>

        <div className={`mt-4 rounded p-6 text-center ${styles.form2}`}>
          <p className={styles.switchText}>
            Bạn chưa có tài khoản?{" "}
            <Link href="/accounts/register" className={styles.primaryLink}>
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
