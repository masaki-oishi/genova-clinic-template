<?php
/**
 * Template Name: スタッフ紹介
 * Description: 院長・スタッフプロフィール
 */
get_header(); ?>

<!-- PAGE HERO -->
<section class="pg-hero">
  <div class="inner rv">
    <h1 class="pg-hero__title">
      <small>Staff</small>
      <?php the_title(); ?>
    </h1>
    <p class="pg-hero__lead">チームで支える安心の医療</p>
  </div>
</section>

<!-- DIRECTOR -->
<section class="sec sec--white">
  <div class="container">
    <div class="sec-head rv">
      <p class="sec-head__label">Director</p>
      <h2 class="sec-head__title">院長紹介</h2>
    </div>
    <div class="staff-director rv">
      <div class="staff-director__photo">
        <div class="placeholder-img placeholder-img--portrait">
          <span>院長写真</span>
        </div>
      </div>
      <div class="staff-director__body">
        <p class="staff-director__position">院長</p>
        <h3 class="staff-director__name">○○ ○○<span>（○○ ○○）</span></h3>
        <div class="staff-director__profile">
          <h4>経歴</h4>
          <ul>
            <li>○○大学歯学部 卒業</li>
            <li>○○歯科医院 勤務</li>
            <li>○○年 当院開院</li>
          </ul>
          <h4>資格・所属</h4>
          <ul>
            <li>日本歯科医師会 会員</li>
            <li>○○学会 認定医</li>
          </ul>
        </div>
        <div class="staff-director__message">
          <p>患者さまとの対話を大切に、お一人おひとりに最適な治療をご提案いたします。お口のことでお困りのことがあれば、お気軽にご相談ください。</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- STAFF LIST -->
<section class="sec sec--sub">
  <div class="container">
    <div class="sec-head rv">
      <p class="sec-head__label">Team</p>
      <h2 class="sec-head__title">スタッフ</h2>
    </div>
    <div class="staff-grid">
      <?php
      // ACF利用時: $staff = get_field('staff_members') ?: [];
      $staff = [
        ['name' => '○○ ○○', 'position' => '歯科衛生士', 'message' => '皆さまのお口の健康をサポートします。'],
        ['name' => '○○ ○○', 'position' => '歯科衛生士', 'message' => '丁寧なクリーニングを心がけています。'],
        ['name' => '○○ ○○', 'position' => '歯科助手',   'message' => '安心して通えるクリニックづくりに努めます。'],
        ['name' => '○○ ○○', 'position' => '受付',       'message' => '笑顔でお迎えいたします。'],
      ];
      foreach ($staff as $i => $s) : ?>
        <div class="staff-card rv" data-d="<?php echo $i % 3; ?>">
          <div class="staff-card__photo">
            <div class="placeholder-img">
              <span>スタッフ写真</span>
            </div>
          </div>
          <div class="staff-card__body">
            <p class="staff-card__position"><?php echo esc_html($s['position']); ?></p>
            <h3 class="staff-card__name"><?php echo esc_html($s['name']); ?></h3>
            <p class="staff-card__message"><?php echo esc_html($s['message']); ?></p>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<?php get_footer(); ?>
