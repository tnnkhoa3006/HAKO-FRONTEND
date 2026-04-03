import LoginGoogle from "@/components/LoginGoogle";
import Image from "next/image";
import styles from "./Register.module.scss";
import Link from "next/link";

type RegisterProps = {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  fullName: string;
  setFullName: (fullName: string) => void;
  username: string;
  setUsername: (username: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  handleRegister: () => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
};

export default function Register({
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  username,
  setUsername,
  error,
  handleRegister,
  handleKeyDown,
}: RegisterProps) {
  return (
    <div className={`flex min-h-screen items-center justify-center ${styles.container}`}>
      <div className={styles.wrapper}>
        <div className={`mb-4 rounded p-8 ${styles.form}`} style={{ marginTop: "10px" }}>
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
            Tạo tài khoản để bắt đầu kết nối, chia sẻ và khám phá những cuộc trò chuyện mới trên HAKO.
          </p>

          <LoginGoogle mode="signup" />

          <div className={styles.divider}>
            <div className={styles.dividerLine}></div>
            <span className={styles.dividerText}>HOẶC</span>
            <div className={styles.dividerLine}></div>
          </div>

          <div className={styles.formStack}>
            <div>
              <input
                type="email"
                placeholder="Số di động hoặc email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Tên đầy đủ"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={styles.input}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Tên người dùng"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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

            <div className="pt-2">
              <button onClick={handleRegister} className={styles.submitButton}>
                Đăng ký
              </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.legalText}>
              <p>
                Những người dùng dịch vụ của chúng tôi có thể đã tải thông tin liên hệ của bạn lên HAKO.{" "}
                <a href="#" className={styles.primaryLink}>
                  Tìm hiểu thêm
                </a>
              </p>
            </div>

            <div className={styles.legalText}>
              <p>
                Bằng cách đăng ký, bạn đồng ý với{" "}
                <a href="#" className={styles.primaryLink}>
                  Điều khoản
                </a>
                ,{" "}
                <a href="#" className={styles.primaryLink}>
                  Chính sách quyền riêng tư
                </a>{" "}
                và{" "}
                <a href="#" className={styles.primaryLink}>
                  Chính sách cookie
                </a>{" "}
                của chúng tôi.
              </p>
            </div>
          </div>
        </div>

        <div className={`mt-4 rounded p-6 text-center ${styles.form2}`}>
          <p className={styles.switchText}>
            Bạn có tài khoản?{" "}
            <Link href="/accounts/login" className={styles.primaryLink}>
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
