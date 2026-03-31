<?php
/**
 * Template Name: 医院紹介
 * Description: クリニック紹介・理念・院長メッセージ・概要
 */
get_header(); ?>

<!-- PAGE HERO -->
<section class="pg-hero">
  <div class="inner rv">
    <h1 class="pg-hero__title">
      <small>About</small>
      <?php the_title(); ?>
    </h1>
    <p class="pg-hero__lead"><?php echo esc_html(clinic_get('clinic_catchcopy', '')); ?></p>
  </div>
</section>

<!-- PHILOSOPHY / CONCEPT -->
<section class="sec sec--white">
  <div class="container">
    <div class="sec-head rv">
      <p class="sec-head__label">Philosophy</p>
      <h2 class="sec-head__title">私たちの想い</h2>
    </div>
    <div class="about-philosophy rv">
      <div class="about-philosophy__img">
        <?php if (has_post_thumbnail()) : ?>
          <?php the_post_thumbnail('hero', ['loading' => 'lazy']); ?>
        <?php else : ?>
          <div class="placeholder-img">
            <span>クリニック外観・内観写真</span>
          </div>
        <?php endif; ?>
      </div>
      <div class="about-philosophy__body">
        <?php the_content(); ?>
      </div>
    </div>
  </div>
</section>

<!-- FEATURES / 当院の特徴 -->
<section class="sec sec--sub">
  <div class="container">
    <div class="sec-head rv">
      <p class="sec-head__label">Features</p>
      <h2 class="sec-head__title">当院の特徴</h2>
    </div>
    <div class="about-features rv">
      <?php
      // カスタムフィールドまたはリピーターで管理想定
      // ACF: get_field('features') で取得
      $features = [
        ['icon' => 'shield', 'title' => '丁寧なカウンセリング', 'text' => 'お一人おひとりのお悩みやご要望を丁寧にヒアリングし、最適な治療計画をご提案します。'],
        ['icon' => 'clock',  'title' => '通いやすい診療時間',   'text' => '平日夜間・土曜日も診療。お仕事帰りや休日にも通いやすい体制を整えています。'],
        ['icon' => 'star',   'title' => '最新の設備',           'text' => '歯科用CT・マイクロスコープなど最新の医療機器を導入し、精密な診断と治療を行います。'],
      ];
      // ACF利用時: $features = get_field('features') ?: [];

      foreach ($features as $i => $f) : ?>
        <div class="feature-card rv" data-d="<?php echo $i; ?>">
          <div class="feature-card__icon">
            <?php echo clinic_feature_icon($f['icon']); ?>
          </div>
          <h3 class="feature-card__title"><?php echo esc_html($f['title']); ?></h3>
          <p class="feature-card__text"><?php echo esc_html($f['text']); ?></p>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<!-- DIRECTOR MESSAGE / 院長メッセージ -->
<section class="sec sec--white">
  <div class="container">
    <div class="sec-head rv">
      <p class="sec-head__label">Message</p>
      <h2 class="sec-head__title">院長メッセージ</h2>
    </div>
    <div class="about-message rv">
      <div class="about-message__photo">
        <div class="placeholder-img placeholder-img--portrait">
          <span>院長写真</span>
        </div>
      </div>
      <div class="about-message__body">
        <p class="about-message__label">Director's Message</p>
        <h3 class="about-message__heading">
          患者さまの「こうなりたい」に<br>寄り添う診療を。
        </h3>
        <div class="about-message__text">
          <p>当院は「来てよかった」と思っていただけるクリニックを目指し、開院いたしました。</p>
          <p>痛みや不安を最小限に抑えた治療はもちろん、治療後のメンテナンスまで一貫してサポートいたします。</p>
          <p>お口のことでお悩みがあれば、どうぞお気軽にご相談ください。</p>
        </div>
        <p class="about-message__author">
          <?php echo esc_html(clinic_get('clinic_name', '')); ?><br>
          院長 <strong>○○ ○○</strong>
        </p>
      </div>
    </div>
  </div>
</section>

<!-- CLINIC INFO -->
<section class="sec sec--sub">
  <div class="container">
    <div class="sec-head rv">
      <p class="sec-head__label">Information</p>
      <h2 class="sec-head__title">医院情報</h2>
    </div>
    <dl class="dl-table rv">
      <div class="dl-row">
        <dt>医院名</dt>
        <dd><?php echo esc_html(clinic_get('clinic_name', '')); ?></dd>
      </div>
      <div class="dl-row">
        <dt>所在地</dt>
        <dd><?php echo nl2br(esc_html(clinic_get('clinic_address', ''))); ?></dd>
      </div>
      <div class="dl-row">
        <dt>電話番号</dt>
        <dd><?php echo esc_html(clinic_get('clinic_tel', '')); ?></dd>
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

<!-- ACCESS / MAP -->
<section class="sec sec--white">
  <div class="container">
    <div class="sec-head rv">
      <p class="sec-head__label">Access</p>
      <h2 class="sec-head__title">アクセス</h2>
    </div>
    <div class="about-map rv">
      <?php $gmap = clinic_get('clinic_gmap_embed'); ?>
      <?php if ($gmap) : ?>
        <div class="map-embed">
          <?php echo $gmap; ?>
        </div>
      <?php else : ?>
        <div class="map-placeholder">
          <svg viewBox="0 0 48 48" width="40" height="40" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M24 4C16.28 4 10 10.28 10 18c0 10.5 14 26 14 26s14-15.5 14-26c0-7.72-6.28-14-14-14z"/>
            <circle cx="24" cy="18" r="5"/>
          </svg>
          <span>Google Maps 埋め込み予定エリア</span>
          <span class="map-placeholder__addr"><?php echo esc_html(clinic_get('clinic_address', '')); ?></span>
        </div>
      <?php endif; ?>
    </div>
  </div>
</section>

<?php get_footer(); ?>
