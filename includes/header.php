<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<!-- HEADER -->
<header class="hd" id="hd">
  <a href="<?php echo esc_url(home_url('/')); ?>" class="hd-logo">
    <?php if (has_custom_logo()) : ?>
      <?php the_custom_logo(); ?>
    <?php else : ?>
      <?php echo esc_html(clinic_get('clinic_name', get_bloginfo('name'))); ?>
    <?php endif; ?>
  </a>

  <?php $tel = clinic_get('clinic_tel'); ?>
  <?php if ($tel) : ?>
    <div class="hd-tel">
      <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      <div>
        <a href="tel:<?php echo esc_attr(preg_replace('/[^0-9+]/', '', $tel)); ?>"><?php echo esc_html($tel); ?></a>
        <span class="hd-tel-sub"><?php echo esc_html(clinic_get('clinic_hours', '')); ?></span>
      </div>
    </div>
  <?php endif; ?>

  <nav class="hd-nav">
    <?php
    wp_nav_menu([
      'theme_location' => 'primary',
      'container'      => false,
      'items_wrap'     => '%3$s',
      'fallback_cb'    => false,
      'depth'          => 1,
    ]);
    ?>
    <?php $yoyaku = clinic_get('clinic_web_yoyaku'); ?>
    <?php if ($yoyaku) : ?>
      <a href="<?php echo esc_url($yoyaku); ?>" class="hd-cta">Web予約</a>
    <?php endif; ?>
  </nav>

  <div class="burger" id="burger" aria-label="メニュー" role="button" tabindex="0">
    <span></span><span></span><span></span>
  </div>
</header>

<!-- MOBILE NAV -->
<div class="mobile-nav" id="mobile-nav">
  <?php
  wp_nav_menu([
    'theme_location' => 'primary',
    'container'      => false,
    'items_wrap'     => '%3$s',
    'fallback_cb'    => false,
    'depth'          => 1,
  ]);
  ?>
  <?php if ($yoyaku) : ?>
    <a href="<?php echo esc_url($yoyaku); ?>" class="btn btn--primary">Web予約</a>
  <?php endif; ?>
  <?php if ($tel) : ?>
    <a href="tel:<?php echo esc_attr(preg_replace('/[^0-9+]/', '', $tel)); ?>" class="btn btn--outline">電話する</a>
  <?php endif; ?>
</div>

<?php clinic_breadcrumb(); ?>
