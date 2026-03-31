<?php
/**
 * Template Name: アクセス
 * Description: 地図・診療時間・交通案内
 */
get_header(); ?>

<!-- PAGE HERO -->
<section class="pg-hero">
  <div class="inner rv">
    <h1 class="pg-hero__title">
      <small>Access</small>
      <?php the_title(); ?>
    </h1>
    <p class="pg-hero__lead">ご来院方法のご案内</p>
  </div>
</section>

<!-- MAP -->
<section class="sec sec--white">
  <div class="container">
    <div class="access-map rv">
      <?php $gmap = clinic_get('clinic_gmap_embed'); ?>
      <?php if ($gmap) : ?>
        <div class="map-embed map-embed--large">
          <?php echo $gmap; ?>
        </div>
      <?php else : ?>
        <div class="map-placeholder map-placeholder--large">
          <svg viewBox="0 0 48 48" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M24 4C16.28 4 10 10.28 10 18c0 10.5 14 26 14 26s14-15.5 14-26c0-7.72-6.28-14-14-14z"/>
            <circle cx="24" cy="18" r="5"/>
          </svg>
          <span>Google Maps 埋め込み予定エリア</span>
        </div>
      <?php endif; ?>
    </div>
  </div>
</section>

<!-- CLINIC INFO TABLE -->
<section class="sec sec--sub">
  <div class="container">
    <div class="sec-head rv">
      <p class="sec-head__label">Information</p>
      <h2 class="sec-head__title">医院情報</h2>
    </div>
    <dl class="dl-table rv">
      <div class="dl-row">
        <dt>所在地</dt>
        <dd><?php echo nl2br(esc_html(clinic_get('clinic_address', '〒000-0000 ○○県○○市○○ 0-0-0'))); ?></dd>
      </div>
      <div class="dl-row">
        <dt>電話番号</dt>
        <dd>
          <?php $tel = clinic_get('clinic_tel'); ?>
          <?php if ($tel) : ?>
            <a href="tel:<?php echo esc_attr(preg_replace('/[^0-9+]/', '', $tel)); ?>"><?php echo esc_html($tel); ?></a>
          <?php endif; ?>
        </dd>
      </div>
      <div class="dl-row">
        <dt>診療時間</dt>
        <dd><?php echo nl2br(esc_html(clinic_get('clinic_hours', ''))); ?></dd>
      </div>
      <div class="dl-row">
        <dt>休診日</dt>
        <dd><?php echo esc_html(clinic_get('clinic_closed', '')); ?></dd>
      </div>
    </dl>
  </div>
</section>

<!-- HOURS TABLE -->
<section class="sec sec--white">
  <div class="container">
    <div class="sec-head rv">
      <p class="sec-head__label">Hours</p>
      <h2 class="sec-head__title">診療時間</h2>
    </div>
    <div class="hours-table-wrap rv">
      <table class="hours-table">
        <thead>
          <tr>
            <th>診療時間</th>
            <th>月</th><th>火</th><th>水</th><th>木</th><th>金</th><th>土</th><th>日</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>9:00〜12:30</td>
            <td>○</td><td>○</td><td>○</td><td>−</td><td>○</td><td>○</td><td>−</td>
          </tr>
          <tr>
            <td>14:00〜18:30</td>
            <td>○</td><td>○</td><td>○</td><td>−</td><td>○</td><td>△</td><td>−</td>
          </tr>
        </tbody>
      </table>
      <p class="hours-note">△ 土曜午後は 14:00〜17:00 ／ 休診日: 木曜・日曜・祝日</p>
    </div>
  </div>
</section>

<!-- DIRECTIONS -->
<section class="sec sec--sub">
  <div class="container">
    <div class="sec-head rv">
      <p class="sec-head__label">Directions</p>
      <h2 class="sec-head__title">交通案内</h2>
    </div>
    <div class="directions rv">
      <div class="direction-item">
        <div class="direction-item__icon">
          <?php echo clinic_feature_icon('map'); ?>
        </div>
        <div>
          <h3 class="direction-item__title">電車でお越しの方</h3>
          <p class="direction-item__text">○○線「○○駅」より徒歩○分</p>
        </div>
      </div>
      <div class="direction-item">
        <div class="direction-item__icon">
          <?php echo clinic_feature_icon('home'); ?>
        </div>
        <div>
          <h3 class="direction-item__title">お車でお越しの方</h3>
          <p class="direction-item__text">○○通り沿い、○○交差点すぐ。駐車場○台完備</p>
        </div>
      </div>
    </div>
  </div>
</section>

<?php get_footer(); ?>
