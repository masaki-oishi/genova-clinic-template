<!-- CTA BANNER -->
<section class="cta-banner rv">
  <div class="container">
    <p class="cta-banner__title">まずはお気軽にご相談ください</p>
    <p class="cta-banner__text">ご予約・お問い合わせはお電話またはWebから承っております</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      <?php $yoyaku = clinic_get('clinic_web_yoyaku'); ?>
      <?php if ($yoyaku) : ?>
        <a href="<?php echo esc_url($yoyaku); ?>" class="btn btn--primary">Web予約はこちら</a>
      <?php endif; ?>
      <?php $tel = clinic_get('clinic_tel'); ?>
      <?php if ($tel) : ?>
        <a href="tel:<?php echo esc_attr(preg_replace('/[^0-9+]/', '', $tel)); ?>" class="btn btn--outline" style="border-color:rgba(255,255,255,0.3);color:#fff;">
          <?php echo esc_html($tel); ?>
        </a>
      <?php endif; ?>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer class="ft">
  <div class="container">
    <div class="ft-grid">
      <div class="ft-brand">
        <a href="<?php echo esc_url(home_url('/')); ?>" class="hd-logo">
          <?php echo esc_html(clinic_get('clinic_name', get_bloginfo('name'))); ?>
        </a>
        <?php $addr = clinic_get('clinic_address'); ?>
        <?php if ($addr) : ?>
          <p><?php echo nl2br(esc_html($addr)); ?></p>
        <?php endif; ?>
      </div>

      <div>
        <h4>Menu</h4>
        <div class="ft-links">
          <?php
          wp_nav_menu([
            'theme_location' => 'footer',
            'container'      => false,
            'items_wrap'     => '%3$s',
            'fallback_cb'    => false,
            'depth'          => 1,
          ]);
          ?>
        </div>
      </div>

      <div>
        <h4>診療時間</h4>
        <dl class="ft-info">
          <?php $hours = clinic_get('clinic_hours'); ?>
          <?php if ($hours) : ?>
            <dt>診療時間</dt>
            <dd><?php echo nl2br(esc_html($hours)); ?></dd>
          <?php endif; ?>
          <?php $closed = clinic_get('clinic_closed'); ?>
          <?php if ($closed) : ?>
            <dt>休診日</dt>
            <dd><?php echo esc_html($closed); ?></dd>
          <?php endif; ?>
        </dl>
      </div>

      <div>
        <h4>ご予約</h4>
        <div class="ft-links">
          <?php if ($yoyaku) : ?>
            <a href="<?php echo esc_url($yoyaku); ?>">Web予約</a>
          <?php endif; ?>
          <?php $line = clinic_get('clinic_line_url'); ?>
          <?php if ($line) : ?>
            <a href="<?php echo esc_url($line); ?>" target="_blank" rel="noopener">LINE予約</a>
          <?php endif; ?>
          <?php if ($tel) : ?>
            <a href="tel:<?php echo esc_attr(preg_replace('/[^0-9+]/', '', $tel)); ?>">お電話</a>
          <?php endif; ?>
        </div>
      </div>
    </div>

    <div class="ft-btm">
      <span>&copy; <?php echo date('Y'); ?> <?php echo esc_html(clinic_get('clinic_name', get_bloginfo('name'))); ?></span>
      <span>Powered by GENOVA</span>
    </div>
  </div>
</footer>

<!-- SP CTA -->
<div class="sp-cta">
  <?php if ($yoyaku) : ?>
    <a href="<?php echo esc_url($yoyaku); ?>" class="btn btn--primary">Web予約</a>
  <?php endif; ?>
  <?php if ($tel) : ?>
    <a href="tel:<?php echo esc_attr(preg_replace('/[^0-9+]/', '', $tel)); ?>" class="btn btn--outline">電話する</a>
  <?php endif; ?>
</div>

<?php wp_footer(); ?>
</body>
</html>
