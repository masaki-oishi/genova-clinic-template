<?php
/**
 * GENOVA Clinic Template — functions.php
 * 医療・歯科クリニック向けWordPressテーマ
 */

define('CLINIC_VERSION', '1.0.0');
define('CLINIC_DIR', get_template_directory());
define('CLINIC_URI', get_template_directory_uri());

/* ---------- Theme Setup ---------- */
add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'gallery', 'caption', 'style', 'script']);
    add_theme_support('custom-logo', [
        'height'      => 80,
        'width'       => 240,
        'flex-height' => true,
        'flex-width'  => true,
    ]);

    register_nav_menus([
        'primary'   => 'グローバルナビ',
        'footer'    => 'フッターナビ',
    ]);

    add_image_size('hero', 1920, 800, true);
    add_image_size('card', 640, 480, true);
    add_image_size('staff', 480, 480, true);
    add_image_size('thumbnail-lg', 800, 600, true);
});

/* ---------- Assets ---------- */
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('google-fonts',
        'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Zen+Kaku+Gothic+New:wght@300;400;500;700;900&display=swap',
        [], null
    );

    wp_enqueue_style('clinic-variables', CLINIC_URI . '/assets/css/base/variables.css', [], CLINIC_VERSION);
    wp_enqueue_style('clinic-reset', CLINIC_URI . '/assets/css/base/reset.css', ['clinic-variables'], CLINIC_VERSION);
    wp_enqueue_style('clinic-header', CLINIC_URI . '/assets/css/layout/header.css', ['clinic-reset'], CLINIC_VERSION);
    wp_enqueue_style('clinic-footer', CLINIC_URI . '/assets/css/layout/footer.css', ['clinic-reset'], CLINIC_VERSION);
    wp_enqueue_style('clinic-components', CLINIC_URI . '/assets/css/components/components.css', ['clinic-reset'], CLINIC_VERSION);

    // Page-specific CSS
    $page_styles = [
        'templates/page-about.php'     => 'about',
        'templates/page-treatment.php' => 'treatment',
        'templates/page-staff.php'     => 'staff',
        'templates/page-access.php'    => 'access',
        'templates/page-price.php'     => 'price',
    ];
    foreach ($page_styles as $tpl => $name) {
        if (is_page_template($tpl)) {
            wp_enqueue_style("clinic-{$name}", CLINIC_URI . "/assets/css/pages/{$name}.css", ['clinic-components'], CLINIC_VERSION);
        }
    }

    wp_enqueue_script('clinic-main', CLINIC_URI . '/assets/js/modules/main.js', [], CLINIC_VERSION, true);
});

/* ---------- カスタマイザー: クリニック基本情報 ---------- */
add_action('customize_register', function ($wp_customize) {
    $wp_customize->add_section('clinic_info', [
        'title'    => 'クリニック情報',
        'priority' => 30,
    ]);

    $fields = [
        'clinic_name'       => ['label' => 'クリニック名',           'type' => 'text'],
        'clinic_name_en'    => ['label' => 'クリニック名（英語）',   'type' => 'text'],
        'clinic_catchcopy'  => ['label' => 'キャッチコピー',         'type' => 'text'],
        'clinic_tel'        => ['label' => '電話番号',               'type' => 'text'],
        'clinic_address'    => ['label' => '住所',                   'type' => 'textarea'],
        'clinic_hours'      => ['label' => '診療時間',               'type' => 'textarea'],
        'clinic_closed'     => ['label' => '休診日',                 'type' => 'text'],
        'clinic_gmap_embed' => ['label' => 'Google Maps 埋め込みURL','type' => 'textarea'],
        'clinic_line_url'   => ['label' => 'LINE予約URL',            'type' => 'url'],
        'clinic_web_yoyaku' => ['label' => 'Web予約URL',             'type' => 'url'],
    ];

    foreach ($fields as $id => $opts) {
        $wp_customize->add_setting($id, ['default' => '', 'sanitize_callback' => 'sanitize_text_field']);
        $wp_customize->add_control($id, [
            'label'   => $opts['label'],
            'section' => 'clinic_info',
            'type'    => $opts['type'],
        ]);
    }
});

/* ---------- ヘルパー ---------- */
function clinic_get($key, $fallback = '') {
    return get_theme_mod($key, $fallback);
}

function clinic_breadcrumb() {
    if (is_front_page()) return;
    echo '<nav class="breadcrumb" aria-label="パンくず"><a href="' . esc_url(home_url('/')) . '">Top</a>';
    if (is_page()) {
        echo ' &mdash; <span>' . esc_html(get_the_title()) . '</span>';
    } elseif (is_single()) {
        $cats = get_the_category();
        if ($cats) echo ' &mdash; <a href="' . esc_url(get_category_link($cats[0]->term_id)) . '">' . esc_html($cats[0]->name) . '</a>';
        echo ' &mdash; <span>' . esc_html(get_the_title()) . '</span>';
    }
    echo '</nav>';
}

function clinic_feature_icon($name) {
    $icons = [
        'shield' => '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        'clock'  => '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        'star'   => '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
        'heart'  => '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
        'users'  => '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        'map'    => '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
        'check'  => '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        'smile'  => '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
        'home'   => '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    ];
    return $icons[$name] ?? $icons['check'];
}
