<?php
/**
 * Plugin Name: Supporter Auth Bridge
 * Description: Proxy login to Java auth server and store tokens in httpOnly cookies.
 * Version: 0.2.0
 */

if (!defined('ABSPATH')) exit;

// ✅ 자바 서버 베이스 URL (끝에 / 없이)
define('SH_AUTH_BASE', 'https://xn----qd6ew2cx70c6uae40epc.com');

// ✅ 자바 로그인 API 경로
define('SH_AUTH_LOGIN_PATH', '/api/supporterHome/login');

// 쿠키 이름
define('SH_COOKIE_ACCESS',  'sh_access');
define('SH_COOKIE_REFRESH', 'sh_refresh');

function sh_same_origin_or_referer_ok() {
  $host = $_SERVER['HTTP_HOST'] ?? '';
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  $referer = $_SERVER['HTTP_REFERER'] ?? '';

  // fetch에서 보내는 헤더(간단 CSRF 방지)
  $xhr = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
  if ($xhr !== 'XMLHttpRequest') return false;

  if ($origin) {
    $oh = parse_url($origin, PHP_URL_HOST);
    if (!$oh || strcasecmp($oh, $host) !== 0) return false;
  }
  if ($referer) {
    $rh = parse_url($referer, PHP_URL_HOST);
    if ($rh && strcasecmp($rh, $host) !== 0) return false;
  }
  return true;
}

function sh_set_cookie($name, $value, $seconds, $samesite = 'Lax') {
  $secure = is_ssl();
  if ($samesite === 'None') $secure = true;

  setcookie($name, $value, [
    'expires'  => time() + max(60, (int)$seconds),
    'path'     => '/',
    'secure'   => $secure,
    'httponly' => true,
    'samesite' => $samesite,
  ]);
}

function sh_clear_cookie($name) {
  setcookie($name, '', [
    'expires'  => time() - 3600,
    'path'     => '/',
    'secure'   => is_ssl(),
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
}

add_action('rest_api_init', function () {

  // ====== REST: 로그인 ======
  register_rest_route('supporter-auth/v1', '/login', [
    'methods' => 'POST',
    'permission_callback' => '__return_true',
    'callback' => function (\WP_REST_Request $req) {

      if (!sh_same_origin_or_referer_ok()) {
        return new WP_Error('forbidden', 'CSRF check failed', ['status' => 403]);
      }

      $body = $req->get_json_params();
      $name  = isset($body['name'])  ? trim((string)$body['name']) : '';
      $phoneDigits = isset($body['phone']) ? preg_replace('/\D+/', '', (string)$body['phone']) : '';
      $phone = sh_format_phone_hyphen($phoneDigits);

      if (!$name || !$phone) {
        return new WP_Error('bad_request', 'name/phone required', ['status' => 400]);
      }

      $url = SH_AUTH_BASE . SH_AUTH_LOGIN_PATH;

      // ✅ 자바 로그인 API로 프록시 (요청 바디: name + phone)
      $resp = wp_remote_post($url, [
        'timeout' => 15,
        'headers' => [
          'Content-Type' => 'application/json',
          'Accept'       => 'application/json',
        ],
        'body'    => wp_json_encode([
          'name'  => $name,
          'phone' => $phone,
        ]),
      ]);

      if (is_wp_error($resp)) {
        return new WP_Error('upstream_error', $resp->get_error_message(), ['status' => 502]);
      }

      $code = (int) wp_remote_retrieve_response_code($resp);
      $raw  = (string) wp_remote_retrieve_body($resp);
      $json = json_decode($raw, true);

      if ($code !== 200 || !is_array($json)) {
        // 자바가 에러 메시지를 내려주면 그대로 보여주기(너무 길면 잘라서)
        return new WP_Error('login_failed', 'upstream rejected: ' . substr($raw, 0, 200), ['status' => 401]);
      }

      $token = $json['token'] ?? null;
      $ttl   = (int)($json['expiresIn'] ?? 900); // 자바가 안주면 900초 기본

      if (!$token) {
        return new WP_Error('bad_upstream_payload', 'missing token', ['status' => 502]);
      }

      // ✅ 토큰 쿠키 저장
      sh_set_cookie(SH_COOKIE_ACCESS, $token, $ttl, 'Lax');

      // ✅ WP 사용자 연동(찾거나 생성) + WP 로그인
      $u = sh_get_or_create_wp_user($name, $phoneDigits);
      if (is_wp_error($u)) {
        return new WP_Error('wp_user_error', $u->get_error_message(), ['status' => 500]);
      }
      sh_wp_sign_in_user($u);

      return ['ok' => true];
    }
  ]);

  // ====== REST: 로그아웃 ======
  register_rest_route('supporter-auth/v1', '/logout', [
    'methods' => 'POST',
    'permission_callback' => '__return_true',
    'callback' => function () {
      if (!sh_same_origin_or_referer_ok()) {
        return new WP_Error('forbidden', 'CSRF check failed', ['status' => 403]);
      }
      sh_clear_cookie(SH_COOKIE_ACCESS);
      sh_clear_cookie(SH_COOKIE_REFRESH);
      return ['ok' => true];
    }
  ]);
});

function sh_format_phone_hyphen($digits) {
  $digits = preg_replace('/\D+/', '', (string)$digits);

  $len = strlen($digits);

  // 11자리: 01012345678 -> 010-1234-5678
  if ($len === 11) {
    return preg_replace('/^(\d{3})(\d{4})(\d{4})$/', '$1-$2-$3', $digits);
  }

  // 10자리: 0101234567 -> 010-123-4567 (또는 지역번호 고려)
  if ($len === 10) {
    // 서울 02xxxxxxx 형태면 02-xxxx-xxxx
    if (str_starts_with($digits, '02')) {
      return preg_replace('/^(02)(\d{4})(\d{4})$/', '$1-$2-$3', $digits);
    }
    // 그 외는 3-3-4
    return preg_replace('/^(\d{3})(\d{3})(\d{4})$/', '$1-$2-$3', $digits);
  }

  // 그 외(길이 이상함)는 원본(숫자만) 반환
  return $digits;
}

function sh_find_user_by_phone_digits($phoneDigits) {
  $users = get_users([
    'meta_key'   => 'sh_phone_digits',
    'meta_value' => $phoneDigits,
    'number'     => 1,
    'fields'     => 'all',
  ]);
  return $users ? $users[0] : null;
}

function sh_get_or_create_wp_user($name, $phoneDigits) {
  // 1) 전화번호로 기존 유저 찾기
  $u = sh_find_user_by_phone_digits($phoneDigits);
  if ($u) return $u;

  // 2) 없으면 생성 (user_login은 유니크해야 함)
  $user_login = 'sh_' . $phoneDigits; // 예: sh_01036595845
  $user_email = $phoneDigits . '@supporter.local'; // 이메일 필수인 환경 대비 (가짜 도메인)
  $random_pass = wp_generate_password(20, true, true);

  // 혹시 같은 login이 이미 있으면 뒤에 랜덤 붙이기
  if (username_exists($user_login)) {
    $user_login .= '_' . wp_generate_password(6, false, false);
  }
  if (email_exists($user_email)) {
    $user_email = $phoneDigits . '+' . wp_generate_password(6, false, false) . '@supporter.local';
  }

  $user_id = wp_insert_user([
    'user_login'   => $user_login,
    'user_pass'    => $random_pass,
    'user_email'   => $user_email,
    'display_name' => $name,
    'nickname'     => $name,
    'role'         => 'subscriber', // 필요하면 'supporter' 같은 커스텀 role로 바꿔도 됨
  ]);

  if (is_wp_error($user_id)) return $user_id;

  update_user_meta($user_id, 'sh_phone_digits', $phoneDigits);
  update_user_meta($user_id, 'sh_name', $name);

  return get_user_by('id', $user_id);
}

function sh_wp_sign_in_user($user) {
  wp_set_current_user($user->ID);
  wp_set_auth_cookie($user->ID, true, is_ssl()); // true=remember (원하면 false)
  do_action('wp_login', $user->user_login, $user);
}

// ====== 숏코드: 커스텀 로그인 폼 ======
add_shortcode('supporter_login', function () {
  $redirect_to = isset($_GET['redirect_to']) ? esc_url_raw($_GET['redirect_to']) : home_url('/');

  ob_start(); ?>
<div style="max-width:420px;margin:40px auto;padding:24px;border-radius:14px">

    <label style="display:block;margin:10px 0 6px">이름</label>
    <input id="sh_name"
           style="
                width: min(84.29vw, 421.45px);
                height: min(11.51vw, 57.55px);
                border: 1px solid #D9D9D9;
                border-radius: min(8.9vw, 44.5px);
                padding-left: min(4.2vw, 21px);
                box-sizing: border-box;
                font-size: min(3.82vw, 19.1px);
                margin-top: min(2.09vw, 10.45px);"
           placeholder="이름을 입력하세요."/>

    <label style="display:block;margin:12px 0 6px">휴대폰번호</label>
    <input id="sh_phone"
           style="
                width: min(84.29vw, 421.45px);
                height: min(11.51vw, 57.55px);
                border: 1px solid #D9D9D9;
                border-radius: min(8.9vw, 44.5px);
                padding-left: min(4.2vw, 21px);
                box-sizing: border-box;
                font-size: min(3.82vw, 19.1px);
                margin-top: min(2.09vw, 10.45px);"
           placeholder="휴대폰번호를 입력해주세요."/>

    <button id="sh_btn" style="
                            width: min(84.29vw, 421.45px);
                            height: min(13.61vw, 68.05px);
                            margin-top: min(8.18vw, 40.9px);
                            margin-bottom: min(7.85vw, 39.25px);
                            border-radius: min(8.9vw, 44.5px);
                            font-size: min(5.23vw, 26.15px);
                            background-color: #033B92;
                            font-weight: 700;
                            cursor: pointer;
                            color: #ffffff;
                            border: none;
                            box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.25);">
        로그인
    </button>

    <p id="sh_msg" style="margin-top:12px"></p>
</div>

  <script>
  (function(){
    const btn = document.getElementById('sh_btn');
    const msg = document.getElementById('sh_msg');

    btn.addEventListener('click', async () => {
      msg.textContent = '로그인 중...';

      const name  = document.getElementById('sh_name').value.trim();
      const phone = document.getElementById('sh_phone').value.trim();

      if (!name || !phone) {
        msg.textContent = '이름과 휴대폰번호를 입력해주세요';
        return;
      }

      try {
        const res = await fetch('/wp-json/supporter-auth/v1/login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({ name, phone })
        });

        const text = await res.text();
        if (!res.ok) {
          msg.textContent = '로그인 실패: ' + (text || '확인 필요');
          return;
        }

        msg.textContent = '로그인 성공!';
        window.location.href = <?php echo json_encode($redirect_to); ?>;
      } catch (e) {
        msg.textContent = '오류: ' + (e && e.message ? e.message : e);
      }
    });
  })();
  </script>
  <?php
  return ob_get_clean();
});
