<?php
/**
 * Template Name: 診療案内
 * Description: 診療科目一覧・各科目の詳細
 */
get_header(); ?>

<!-- PAGE HERO -->
<section class="pg-hero">
  <div class="inner rv">
    <h1 class="pg-hero__title">
      <small>Treatment</small>
      <?php the_title(); ?>
    </h1>
    <p class="pg-hero__lead">当院の診療メニューをご紹介します</p>
  </div>
</section>

<!-- TREATMENT LIST -->
<section class="sec sec--white">
  <div class="container">
    <div class="sec-head rv">
      <p class="sec-head__label">Menu</p>
      <h2 class="sec-head__title">診療メニュー</h2>
      <p class="sec-head__sub">患者さまのお悩みに合わせた幅広い診療をご提供しています</p>
    </div>

    <?php
    // ACF利用時: $treatments = get_field('treatments') ?: [];
    $treatments = [
      [
        'icon'  => 'smile',
        'title' => '一般歯科',
        'en'    => 'General',
        'text'  => '虫歯や歯周病の治療を行います。できるだけ歯を残す治療を心がけ、痛みの少ない治療法をご提案します。',
        'items' => ['虫歯治療', '歯周病治療', '根管治療', '知覚過敏'],
      ],
      [
        'icon'  => 'star',
        'title' => '審美歯科',
        'en'    => 'Aesthetic',
        'text'  => '白く美しい歯を実現する審美治療。セラミックやホワイトニングなど、見た目の美しさと機能性を両立します。',
        'items' => ['セラミック', 'ホワイトニング', 'ラミネートベニア'],
      ],
      [
        'icon'  => 'shield',
        'title' => '予防歯科',
        'en'    => 'Preventive',
        'text'  => '定期的なメンテナンスで、虫歯や歯周病を未然に防ぎます。プロフェッショナルケアと正しいセルフケアをサポートします。',
        'items' => ['定期検診', 'PMTC', 'フッ素塗布', 'ブラッシング指導'],
      ],
      [
        'icon'  => 'heart',
        'title' => '小児歯科',
        'en'    => 'Pediatric',
        'text'  => 'お子さまが歯医者を好きになれるよう、やさしく丁寧な診療を行います。成長に合わせた予防・治療をご提供します。',
        'items' => ['虫歯予防', 'シーラント', '歯並び相談'],
      ],
    ];
    ?>

    <div class="treatment-grid">
      <?php foreach ($treatments as $i => $t) : ?>
        <div class="treatment-card rv" data-d="<?php echo $i % 3; ?>">
          <div class="treatment-card__header">
            <div class="treatment-card__icon">
              <?php echo clinic_feature_icon($t['icon']); ?>
            </div>
            <div>
              <span class="treatment-card__en"><?php echo esc_html($t['en']); ?></span>
              <h3 class="treatment-card__title"><?php echo esc_html($t['title']); ?></h3>
            </div>
          </div>
          <p class="treatment-card__text"><?php echo esc_html($t['text']); ?></p>
          <?php if (!empty($t['items'])) : ?>
            <ul class="treatment-card__list">
              <?php foreach ($t['items'] as $item) : ?>
                <li><?php echo esc_html($item); ?></li>
              <?php endforeach; ?>
            </ul>
          <?php endif; ?>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<!-- TREATMENT FLOW -->
<section class="sec sec--sub">
  <div class="container">
    <div class="sec-head rv">
      <p class="sec-head__label">Flow</p>
      <h2 class="sec-head__title">診療の流れ</h2>
    </div>
    <div class="flow-steps container--narrow">
      <?php
      $steps = [
        ['num' => '01', 'title' => 'ご予約',         'text' => 'お電話またはWebからご予約ください。'],
        ['num' => '02', 'title' => 'ご来院・受付',   'text' => '保険証をご持参のうえ、ご来院ください。問診票をご記入いただきます。'],
        ['num' => '03', 'title' => 'カウンセリング', 'text' => 'お悩みやご要望を丁寧にヒアリングし、検査結果をもとに治療計画をご説明します。'],
        ['num' => '04', 'title' => '治療',           'text' => '治療計画にもとづき、できるだけ痛みの少ない治療を行います。'],
        ['num' => '05', 'title' => 'メンテナンス',   'text' => '治療後は定期的なメンテナンスで、健康な状態を維持します。'],
      ];
      foreach ($steps as $s) : ?>
        <div class="flow-step rv">
          <div class="flow-step__num"><?php echo $s['num']; ?></div>
          <div class="flow-step__body">
            <h3 class="flow-step__title"><?php echo esc_html($s['title']); ?></h3>
            <p class="flow-step__text"><?php echo esc_html($s['text']); ?></p>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<?php get_footer(); ?>
