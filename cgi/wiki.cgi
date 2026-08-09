#!/usr/local/bin/ruby -Ku
# -*- coding: utf-8 -*-
#require 'nkf'
require 'cgi'
#require 'fileutils'
#require 'open-uri'
require 'time'

require 'dotenv'
Dotenv.load('/.env')

def render(t,key,symbol,input)

keys=['C','C#','D','D#','E','F','F#','G','G#','A','Bb','B','C','C#','D','D#','E','F','F#','G','G#','A','Bb','B']
keys=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] if symbol=='sharp'
keys=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B','C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'] if symbol=='flat'

buf=''
title=''
subtitle=''
asin=''
links=[]
youtube=''
mp3=''
nicovideo=''
redirect=''
chorded=0

chord=0
word=0
head=0

input.split("\n").each do |line|

line.chomp!
line.gsub!(/&/,'&amp;')
line.gsub!(/</,'&lt;')
line.gsub!(/>/,'&gt;')
line.gsub!(/"/,'&quot;')

if key!=0 || symbol!=''
  line.gsub!('[C##','[D')
  line.gsub!('[D##','[E')
  line.gsub!('[E##','[F#')
  line.gsub!('[F##','[G')
  line.gsub!('[G##','[A')
  line.gsub!('[A##','[B')
  line.gsub!('[B##','[C#')
  line.gsub!('[Cbb','[Bb')
  line.gsub!('[Dbb','[C')
  line.gsub!('[Ebb','[D')
  line.gsub!('[Fbb','[Eb')
  line.gsub!('[Gbb','[F')
  line.gsub!('[Abb','[G')
  line.gsub!('[Bbb','[A')
  line.gsub!('[Bb','[A#') if symbol=='sharp'
  line.gsub!('[Db','[C#') if symbol!='flat'
  line.gsub!('[Eb','[D#') if symbol!='flat'
  line.gsub!('[Gb','[F#') if symbol!='flat'
  line.gsub!('[Ab','[G#') if symbol!='flat'
  line.gsub!('[C#','[Db') if symbol=='flat'
  line.gsub!('[D#','[Eb') if symbol=='flat'
  line.gsub!('[F#','[Gb') if symbol=='flat'
  line.gsub!('[G#','[Ab') if symbol=='flat'
  line.gsub!('[A#','[Bb') if symbol!='sharp'
  line.gsub!('[E#','[F')
  line.gsub!('[B#','[C')
  line.gsub!('[Fb','[E')
  line.gsub!('[Cb','[B')
  line.gsub!('/C##','/D')
  line.gsub!('/D##','/E')
  line.gsub!('/E##','/F#')
  line.gsub!('/F##','/G')
  line.gsub!('/G##','/A')
  line.gsub!('/A##','/B')
  line.gsub!('/B##','/C#')
  line.gsub!('/Cbb','/Bb')
  line.gsub!('/Dbb','/C')
  line.gsub!('/Ebb','/D')
  line.gsub!('/Fbb','/Eb')
  line.gsub!('/Gbb','/F')
  line.gsub!('/Abb','/G')
  line.gsub!('/Bbb','/A')
  line.gsub!('/Bb','/A#') if symbol=='sharp'
  line.gsub!('/Db','/C#') if symbol!='flat'
  line.gsub!('/Eb','/D#') if symbol!='flat'
  line.gsub!('/Gb','/F#') if symbol!='flat'
  line.gsub!('/Ab','/G#') if symbol!='flat'
  line.gsub!('/C#','/Db') if symbol=='flat'
  line.gsub!('/D#','/Eb') if symbol=='flat'
  line.gsub!('/F#','/Gb') if symbol=='flat'
  line.gsub!('/G#','/Ab') if symbol=='flat'
  line.gsub!('/A#','/Bb') if symbol!='sharp'
  line.gsub!('/E#','/F')
  line.gsub!('/B#','/C')
  line.gsub!('/Fb','/E')
  line.gsub!('/Cb','/B')
  line.gsub!('(C##','(D')
  line.gsub!('(D##','(E')
  line.gsub!('(E##','(F#')
  line.gsub!('(F##','(G')
  line.gsub!('(G##','(A')
  line.gsub!('(A##','(B')
  line.gsub!('(B##','(C#')
  line.gsub!('(Cbb','(Bb')
  line.gsub!('(Dbb','(C')
  line.gsub!('(Ebb','(D')
  line.gsub!('(Fbb','(Eb')
  line.gsub!('(Gbb','(F')
  line.gsub!('(Abb','(G')
  line.gsub!('(Bbb','(A')
  line.gsub!('(Bb','(A#') if symbol=='sharp'
  line.gsub!('(Db','(C#') if symbol!='flat'
  line.gsub!('(Eb','(D#') if symbol!='flat'
  line.gsub!('(Gb','(F#') if symbol!='flat'
  line.gsub!('(Ab','(G#') if symbol!='flat'
  line.gsub!('(C#','(Db') if symbol=='flat'
  line.gsub!('(D#','(Eb') if symbol=='flat'
  line.gsub!('(F#','(Gb') if symbol=='flat'
  line.gsub!('(G#','(Ab') if symbol=='flat'
  line.gsub!('(A#','(Bb') if symbol!='sharp'
  line.gsub!('(E#','(F')
  line.gsub!('(B#','(C')
  line.gsub!('(Fb','(E')
  line.gsub!('(Cb','(B')
end

if line =~ /^\s*$/
  buf << "<br />\n"
elsif line =~ /^\s*#(.*)/
  buf << "<!-- "+$1+" -->\n"
elsif line =~ /^\s*\{(t|title):([^}]*)\}/i
  title=$2
elsif line =~ /^\s*\{(st|subtitle):([^}]*)\}/i
  subtitle=$2
elsif line =~ /^\s*\{key:([A-G][#b]?)([^}]*)\}/i
  original_key=$1
  key_ex=$2
  current_key=''
  if key!=0
    current_key=original_key
    current_key="B" if current_key=="Cb"
    current_key="C" if current_key=="B#"
    current_key="E" if current_key=="Fb"
    current_key="F" if current_key=="E#"
    if symbol=='sharp'
      current_key="A#" if current_key=="Bb"
      current_key="C#" if current_key=="Db"
      current_key="D#" if current_key=="Eb"
      current_key="F#" if current_key=="Gb"
      current_key="G#" if current_key=="Ab"
    elsif symbol=='flat'
      current_key="Ab" if current_key=="G#"
      current_key="Bb" if current_key=="A#"
      current_key="Db" if current_key=="C#"
      current_key="Eb" if current_key=="D#"
      current_key="Gb" if current_key=="F#"
    else
      current_key="Bb" if current_key=="A#"
      current_key="C#" if current_key=="Db"
      current_key="D#" if current_key=="Eb"
      current_key="F#" if current_key=="Gb"
      current_key="G#" if current_key=="Ab"
    end
    current_key=keys[keys.index(current_key).to_i+key]
  end
  if original_key!="" &&  key!=0 && key<3
    buf << "<p class=\"key\">Original Key: "+original_key+key_ex+" / Capo: "+(key<0 ? (-key).to_s : (key==1 ? '（半音下げチューニング）' : (key==2 ? '（全音下げチューニング）' : '')))+" / Play: "+current_key+key_ex+"</p>"
  elsif original_key!="" &&  key!=0 && key>2
    buf << "<p class=\"key\">Original Key: "+original_key+key_ex+" / Play: "+current_key+key_ex+"</p>"
  elsif original_key!="" && key==0
    buf << "<p class=\"key\">Key: "+original_key+key_ex+"</p>"
  end
elsif line =~ /^\s*\{asin:([^}]*)\}/i && asin==''
  asin=$1
elsif line =~ /^\s*\{redirect:([^}]*)\}/i
  redirect=$1
elsif line =~ /^\s*\{(c|comment):([^}]*)\}/i
  commentline=$2
  commentline.gsub!(/&amp;spades;/,'<span class="male">&spades;</span>')
  commentline.gsub!(/♠/,'<span class="male">♠</span>')
  commentline.gsub!(/&amp;clubs;/,'<span class="male2">&clubs;</span>')
  commentline.gsub!(/♣/,'<span class="male2">♣</span>')
  commentline.gsub!(/&amp;hearts;/,'<span class="female">&hearts;</span>')
  commentline.gsub!(/♥/,'<span class="female">♥</span>')
  commentline.gsub!(/&amp;diams;/,'<span class="female2">&diams;</span>')
  commentline.gsub!(/♦/,'<span class="female2">♦</span>')
  buf << "<p class=\"line comment\"><strong>"+commentline+"</strong></p>\n"
elsif line =~ /^\s*\{(ci|comment_italic):([^}]*)\}/i
  buf << "<p class=\"line comment\"><strong><i>"+$2+"</i></strong></p>\n"
elsif line =~ /^\s*\{(define|chord):([^}]*)\}/i
  buf << "<!-- "+$2+" -->\n"
elsif line =~ /^\s*\{(soc|start_of_chorus)\}/i
  buf << "<p class=\"line comment\"><strong>※コーラス（ここから）</strong></p>\n"
elsif line =~ /^\s*\{(eoc|end_of_chorus)\}/i
  buf << "<p class=\"line comment\"><strong>※コーラス（ここまで）</strong></p>\n"
elsif line =~ /^\s*\{(sot|start_of_tab)\}/i
  buf << "<p class=\"line comment\"><strong>（タブ譜）</strong></p>\n"
elsif line =~ /^\s*\{(eot|end_of_tab)\}/i
  buf << "<p class=\"line comment\"><strong>&nbsp;</strong></p>\n"
elsif line =~ /^\s*\{(([^}>]*)&gt;|)(https?:[^}]*)\}/i
  #buf << "<p class=\"link\"><a href=\""+$3+"\" target=\"_blank\" rel=\"nofollow\">"+($1=='' ? $3 : $2)+"</a></p>\n"
  #links << "<a href=\""+$3+"\" target=\"_blank\" rel=\"nofollow\" title=\""+($1=='' ? $3 : $2)+"\">関連ページ <img src=\"external.png\" /></a>"
  #links << "<a href=\""+$3+"\" target=\"_blank\" rel=\"nofollow\" title=\""+($1=='' ? $3 : $2)+"\"><img src=\"http://img.simpleapi.net/small/"+$3+"\" class=\"linktb\" alt=\"関連ページ\"/></a>"
  #links << "<a href=\""+$3+"\" target=\"_blank\" rel=\"nofollow\" title=\""+($1=='' ? $3 : $2)+"\"><img src=\"http://mozshot.nemui.org/shot?"+$3+"\" class=\"linktb\" width=\"128\" height=\"128\" alt=\""+($1=='' ? $3 : $2)+"\" /><br /><img src=\"/external.png\" />&nbsp;関連ページ</a>"
  links << "<a href=\""+$3+"\" target=\"_blank\" rel=\"nofollow\" title=\""+($1=='' ? $3 : $2)+"\"><img src=\"http://mozshot.nemui.org/shot?"+$3+"\" class=\"linktb\" width=\"128\" height=\"128\" alt=\""+($1=='' ? $3 : $2)+"\" /><br /><img src=\"/external.png\" />&nbsp;"+($1=='' ? '関連ページ' : $2)+"</a>"

elsif line =~ /^\s*\{youtube:([^}]+)\}/i && youtube==''
  youtube=$1

elsif line =~ /^\s*\{nicovideo:([^}]+)\}/i && nicovideo==''
  nicovideo=$1

elsif line =~ /^\s*\{mp3:(https?:\/\/[^}]+)\}/i && mp3==''
  mp3=$1

else
  line.gsub!(/&amp;spades;/,'<span class="male">&spades;</span>')
  line.gsub!(/♠/,'<span class="male">♠</span>')
  line.gsub!(/&amp;clubs;/,'<span class="male2">&clubs;</span>')
  line.gsub!(/♣/,'<span class="male2">♣</span>')
  line.gsub!(/&amp;hearts;/,'<span class="female">&hearts;</span>')
  line.gsub!(/♥/,'<span class="female">♥</span>')
  line.gsub!(/&amp;diams;/,'<span class="female2">&diams;</span>')
  line.gsub!(/♦/,'<span class="female2">♦</span>')

  buf << "<p class=\"line\">\n"
  head=1
  word=0
  c=''
  line.split(//).each{|l|
    if l=='['
      buf << '</span>' if word==1
      buf << '&nbsp;' if word==0 && head==0
      buf << '<span class="chord">'
      head=0
      chord=1
      word=0
      c=''
    elsif l==']' || ((l=='(' || l==')' || l=='/') && chord==1)
      if key!=0 && c!='N.C.' && c=~/([A-G][#b]?)(.*)/
        c=keys[keys.index($1).to_i+key]+$2
      end
#      if key!=0 && c!='N.C.' && c=~/([^\/]*)\/([A-G][#b]?)(.*)/
#        c=$1+'/'+keys[keys.index($2).to_i+key]+$3
#      end
      buf << c
      buf << '</span>' if l==']'
      chord=0 if l==']'
      buf << '(' if l=='('
      buf << ')' if l==')'
      buf << '/' if l=='/'
      chorded=1
      c=''
    else
      if chord==0 && word==0
        if head==1
          buf << '<span class="wordtop">'+l
        else
            buf << '<span class="word">'+l
        end
        word=1
      else
        if chord==1
          c << l
        else
          buf << l
        end
      end
      head=0
    end
  }
  buf << "</span>" if word==1
  buf << "\n</p>\n"
end

end

buf.gsub!(/<span class="chord">([^<]*)<\/span>/,'<span class="chord" onclick="javascript:popupImage(\'/cd/\1.png\', event);">\1</span>')
buf.gsub!(/#([^\.>]*)\.png/,'s\1.png')
buf.gsub!(/#([^\.>]*)\.png/,'s\1.png')
buf.gsub!(/\/(.)#([^\.>]*)\.png/,'/\1s\2.png')
buf.gsub!(/\/(.)#([^\.>]*)\.png/,'/\1s\2.png')
buf.gsub!(/M([^\.>]*)\.png/,'maj\1.png')
buf.gsub!(/min([^\.>]*)\.png/,'m\1.png')
buf.gsub!(/-5([^\.>]*)\.png/,'b5\1.png')
buf.gsub!(/\+9\.png/,'add9.png')
buf.gsub!(/cd\/([^\/.>]*)\/([^\.>]*)\.png/,'cd/\1on\2.png')

[buf,title,subtitle,asin,links,youtube,mp3,nicovideo,redirect,chorded]

end

def view(t,key,symbol)


  f=File.open('data/'+t+'.txt','r')
  buf,title,subtitle,asin,links,youtube,mp3,nicovideo,redirect,chorded=render(t,key,symbol,f.read)
#  buf=result[0]
#  redirect=result[1]
#  chorded=result[2]
  modified=Time.now
  modified=f.mtime
  f.close

if redirect!=''
  print <<-HTML
Content-Type: text/html; charset=UTF-8
Content-language: ja
Cache-Control: private, s-maxage=0, max-age=0, must-revalidate
Last-Modified: #{modified.httpdate}

<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja" lang="ja">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="robots" content="noindex,nofollow" />
<meta http-equiv="refresh" content="5; url=/wiki/#{CGI.escape(redirect)}">
<link href="/style.css" rel="stylesheet" type="text/css" />
<script type="text/javascript" src="/popup.js"></script>
<title>#{title=="" ? "" : title}#{subtitle=="" ? "" : " （"+subtitle+"）"} - ChordWiki : コード譜共有サイト</title>
</head>
<body>
<div class="header">
<a href="/">[トップ]</a>
<a href="/ranking.html">[ランキング]</a>
<a href="/wiki.cgi?c=edit&t=#{t}">[編集]</a>
<a href="/wiki.cgi?c=log&t=#{t}">[履歴]</a>
<a href="/wiki.cgi?c=note&t=#{t}">[ノート]</a>
<a href="/cd.html" target="cdbook">[コードブック]</a>
</div>
<p>
5秒後に「<a href="/wiki/#{CGI.escape(redirect)}">#{redirect}</a>」へ移動します。
</p>
#{$footer}
</body></html>
HTML

elsif chorded==0
  print "Location: /wiki.cgi?c=edit&t="+t+"&nochord=1\n\n"

else

  require 'mysql2'
  client = Mysql2::Client.new(:host => ENV["DB_HOST"], :username => ENV["DB_USER"], :password => ENV["DB_PASSWORD"], :database => ENV["DB_DATABASE"])
  result=client.query("SELECT type,value FROM info WHERE title='#{t}';")
  info=Hash.new
  result.each{|r|
    info[r['type']]=r['value']
  }
  asin=info[0] unless info[0].nil?
  youtube=info[1] unless info[1].nil?
  nicovideo=info[2] unless info[2].nil?
  itunes=info[3] unless info[3].nil?
  jasrac=info[4] unless info[4].nil?

  #cgi=CGI.new
  #Set-Cookie: history=#{cgi.cookies['history'][0].split('/').map{|m|CGI.escape(m)}.slice(0,9).unshift(t).uniq.join('/')}; expires=#{(Time.now+60*60*24*180).strftime("%a, %d-%b-%Y %H:%M:%S GMT")}; path=/

#Last-Modified: #{modified.httpdate}

  print <<-HTML
Content-Type: text/html; charset=UTF-8
Content-language: ja
Cache-Control: private, s-maxage=0, max-age=0, must-revalidate

<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja" lang="ja" xmlns:og="http://ogp.me/ns#">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="robots" content="noarchive" />
<meta name="viewport" content="width=device-width, maximum-scale=2, minimum-scale=1, user-scalable=yes, initial-scale=1" />
<meta name="format-detection" content="telephone=no" />
<link rel="canonical" href="https://ja.chordwiki.org/wiki/#{t}"/>
<link rel="text/chordpro" href="https://ja.chordwiki.org/wiki.cgi?c=source&t=#{t}"/>
<meta property="fb:app_id" content="210143219012935" />
<meta property="og:title" content="#{title} - ChordWiki : コード譜共有サイト" />
<meta property="og:site_name" content="ChordWiki : コード譜共有サイト" />
<meta property="og:url" content="https://ja.chordwiki.org/wiki/#{t}" />
<meta property="og:type" content="website" />
<meta property="og:description" content="#{subtitle}" />
#{/^sm/!~nicovideo ? '' : '<meta property="og:image" content="https://tn.smilevideo.jp/smile?i='+nicovideo.gsub('sm','')+'" />'}
#{youtube=='' ? '' : '<meta property="og:image" content="https://img.youtube.com/vi/'+youtube+'/0.jpg" />'}
#{asin=='' ? '' : '<meta property="og:image" content="https://images-na.ssl-images-amazon.com/images/P/'+asin+'.09.LZZZZZZZ.jpg" />'}
#{asin=='' && nicovideo=='' && youtube=='' ? '<meta property="og:image" content="https://ja.chordwiki.org/icon.jpg" />' : ''}
<meta name="twitter:card" content="summary" />
<meta name="twitter:site" content="@chordwiki" />
<link href="/style.css?20260714" rel="stylesheet" type="text/css" />
<title>#{title=="" ? "" : title}#{subtitle=="" ? "" : " （"+subtitle+"）"} - ChordWiki : コード譜共有サイト</title>
<script type="text/javascript" src="/chordwiki.js?20260626"></script>
#{$urchin}
HTML

result=client.query("SELECT AVG(rate),COUNT(ipaddress) FROM rating WHERE title='#{t}' AND rate>0;")
ratingstar=(result.first['AVG(rate)'].to_f*2).round.to_f/2
ratingimg="star_#{(result.first['AVG(rate)'].to_f*2).round.to_s}.gif"
ratingcount=result.first['COUNT(ipaddress)']
#print "<meta name=\"rating\" content=\"#{ratingstar}\" />\n" #if ratingstar>0
#if ratingstar>0
#  print <<EOT
#<!--
#  <PageMap>
#    <DataObject type="document">
#      <Attribute name="rating">#{ratingstar}</Attribute>
#    </DataObject>
#  </PageMap>
#-->
#EOT
#end

result=client.query("SELECT title,ipaddress,tag,date FROM tag WHERE title='#{t}' ORDER BY date;")
tags=[]
result.each{|r|
  tags << r['tag']
}

adult=1 if t=="%E3%83%87%E3%83%AA%E3%83%98%E3%83%AB%E5%91%BC%E3%82%93%E3%81%A0%E3%82%89%E5%90%9B%E3%81%8C%E6%9D%A5%E3%81%9F"
adult=1 if t=="%E3%81%99%E3%82%8B%E3%81%93%E3%81%A8%E3%81%AA%E3%81%84%E3%81%8B%E3%82%89%E3%82%BB%E3%83%83%E3%82%AF%E3%82%B9%E3%81%97%E3%82%88%E3%81%86"
adult=1 if t=="%E6%96%B0%E7%94%BA"
adult=1 if t=="1000000SEX"
adult=1 if t=="%E6%83%91%E6%98%9F%EF%BC%B3%E3%83%BB%EF%BC%A5%E3%83%BB%EF%BC%B8%E3%81%AE%E3%83%86%E3%83%BC%E3%83%9E"

unless adult
  print <<-HTML
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6362118305215071"
     crossorigin="anonymous"></script>
<!--script>
  (adsbygoogle = window.adsbygoogle || []).push({
    google_ad_client: "ca-pub-6362118305215071",
    enable_page_level_ads: true
  });
</script -->
HTML
end

print <<-HTML
<meta name="keywords" content="#{CGI.escapeHTML((['コード','コード譜','歌詞','ギター','弾き語り']+tags).join(","))}" />
</head>
<body itemscope itemtype="https://schema.org/MusicRecording"><meta itemprop="name" content="#{title} - コード譜" />
<div id="header">
<ul class="header">
<li><a href="/"><img class="logo" src="/logo_s.jpg" alt="ChordWikiトップ" title="トップページへ戻る" /></a></li>
<li><a href="/ranking.html">[ランキング]</a></li>
<li><a href="/search.html">[検索]</a></li>
<li><a href="/wiki.cgi?c=history">[閲覧履歴]</a></li>
<li><a href="/wiki.cgi?c=edit&t=#{t}">[編集]</a></li>
<li><a href="/wiki.cgi?c=log&t=#{t}">[履歴]</a></li>
<li><a href="/wiki.cgi?c=note&t=#{t}">[<span id="note-attention"></span>ノート]</a></li>
<li><a href="/wiki.cgi?c=rating&t=#{t}">[評価]</a></li>
<!-- li><a href="/wiki.cgi?c=addlist&t=#{t}">[セトリ登録]</a></li -->
<li><a href="/random.cgi">[ランダム]</a></li>
<li><a href="/cd.html" target="cdbook">[コードブック]</a></li>
<li><a href="//beta.chordwiki.org/song/#{t.gsub('+', '%20')}?key=#{key}&symbol=#{symbol}">[新表示を試す]</a></li>
</ul><br clear="all" />
<div id="headeradarea">
<!-- chordwiki-header -->
<ins class="adsbygoogle headerad"
     style="display:block"
     data-ad-client="ca-pub-6362118305215071"
     data-ad-slot="7827325148"
     </ins>
<script>
#{adult ? "" : "(adsbygoogle = window.adsbygoogle || []).push({});"}
</script>
</div>
</div>
<div id="side">
<div class="ratestar">評価: <a href="/wiki.cgi?c=rating&t=#{t}" itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating"><img src="/img/#{ratingimg}" alt="#{ratingstar}" /><meta itemprop="ratingValue" content="#{ratingstar}" /><meta itemprop="ratingCount" content="#{ratingcount}" /></a></div>
<div class="tag">
<div class="tagedit">登録タグ<a href="/wiki.cgi?c=tagedit&t=#{t}">【編集】</a></div>
<ul>
HTML
tags.each_with_index{|tag,i|
#  print "<li><a href=\"/tag/"+CGI.escape(tag).gsub("%26","%2526").gsub("%3B","%253B").gsub("%2F","%252F")+"\" itemprop=\"keywords\">"+CGI.escapeHTML(tag)+"</a> <a href=\"https://dic.nicovideo.jp/a/"+CGI.escape(tag.gsub(/\s/,"_"))+"\" target=\"_blank\"><img src=\"/img/nodic.png\" width=\"13\" height=\"14\" alt=\"ニコニコ大百科\" id=\"dic-"+i.to_s+"\"/></a></li>\n"
  print "<li><a href=\"/tag/"+CGI.escape(tag).gsub("%26","%2526").gsub("%3B","%253B").gsub("%2F","%252F")+"\" itemprop=\"keywords\">"+CGI.escapeHTML(tag)+"</a> <a href=\"https://dic.nicovideo.jp/a/"+CGI.escape(tag.gsub(/\s/,"_"))+"\" target=\"_blank\"><img src=\"/img/dic.png\" width=\"13\" height=\"14\" alt=\"ニコニコ大百科\" id=\"dic-"+i.to_s+"\"/></a></li>\n"
}
print <<-HTML
</ul>
</div>
<div class="infoedit">楽曲情報<a href="/wiki.cgi?c=infoedit&t=#{t}">【編集】</a></div>
<div class="movie">
#{youtube=='' ? '' : '<a href="https://www.youtube.com/watch?v='+youtube+'" target="_blank"><img src="https://img.youtube.com/vi/'+youtube+'/maxresdefault.jpg"id="ytthumbnail" class="thumbnail" width="134" height="104" /><br /><img src="/youtube.png" width="16" alt="YouTube" />&nbsp;YouTube</a><br />'}
#{nicovideo=='' ? '' : '<a href="https://www.nicovideo.jp/watch/'+nicovideo+'" target="_blank"><img id="nicothumbnail" class="thumbnail" width="130" height="100" src="https://tn.smilevideo.jp/smile?i='+nicovideo.gsub('sm','')+'" /><br /><img src="/nicovideo.png" width="16" height="16" alt="ニコニコ動画" />&nbsp;ニコニコ動画</a><br />'}
#{mp3=='' ? '' : '<a href="'+mp3+'" target="_blank" title="MP3を聴く"><img src="/music.png" width="16" height="16" alt="MP3" />&nbsp;MP3<br /></a>'}
#{youtube+nicovideo+mp3 =='' ? '' : '<br />'}
#{links.size==0 ? '' : links.join('<br />')+'<br /><br />'}
</div>
#{itunes ? '<div class="itunes_side"><a href="https://itunes.apple.com/jp/album/id'+itunes+'?uo=4&at=10l8hm" target="itunes_store" style="display:inline-block;overflow:hidden;background:url(/Available_on_iTunes_Badge_JP_110x40_1004.png) no-repeat;width:110px;height:40px;"></a></div><br />' : ''}
#{asin=='' && itunes.nil? ? '<div class="itunes_side"><div id="its.attr" style="width:0px:border:none;"></div></div>' : ''}
<div class="amazon_side">#{asin=='' ? '' : '<a href="https://www.amazon.co.jp/dp/'+asin+'/ref=nosim?tag=chordwiki-22" target="_blank"><img src="/img/amazonlogo.png" alt="Amazon" width="80" /><br /><img src="https://images-na.ssl-images-amazon.com/images/P/'+asin+'.09.LZZZZZZZ" alt="Product Image" width="120" /></a><br><br>'}</div>
#{asin=='' ? '' : (itunes.nil? ? '<div class="itunes_side"><div id="its.attr" style="width:0px:border:none;"></div></div><br /><br />' : '')}
<div class="jasrac" itemprop="identifier" itemscope itemtype="https://schema.org/PropertyValue">
JASRAC作品コード<br /><meta itemprop="propertyID" content="JASRAC" />
#{(jasrac.nil? ? '<a href="/wiki.cgi?c=infoedit&t='+t+'">[情報なし]</a><meta itemprop="value" content="" />' : '<span itemprop="value">'+jasrac+'</span>' )}
<br /><br />
</div>

<div class="sideadarea">
<!-- ChordWiki-side -->
<ins class="adsbygoogle sidead"
     style="display:inline-block;"
     data-ad-client="ca-pub-6362118305215071"
     data-ad-slot="0555870985"></ins>
<script>
#{adult ? "" : "(adsbygoogle = window.adsbygoogle || []).push({});"}
</script>
</div>

<!-- div class="extra_side"><div id="extra_ad">
<br /><br />
<iframe src="https://rcm-fe.amazon-adsystem.com/e/cm?o=9&p=14&l=ur1&category=musicunlimited&banner=0987TWBD1WN1NAKRRKR2&f=ifr&linkID=9097aa8e20610f5d47a2497121e0ca2f&t=chordwiki-22&tracking_id=chordwiki-22" width="160" height="600" scrolling="no" border="0" marginwidth="0" style="border:none;" frameborder="0"></iframe>
</div></div -->
</div>

<div id="key">
<form action="/wiki.cgi" method="get">
<input type="hidden" name="c" value="view">
<input type="hidden" name="t" value="#{CGI.unescape(t)}">
移調: <select size="1" name="key" onChange="this.form.submit();">
<option value="6"#{key==6 ? ' selected' : ''}>+6</option>
<option value="5"#{key==5 ? ' selected' : ''}>+5</option>
<option value="4"#{key==4 ? ' selected' : ''}>+4</option>
<option value="3"#{key==3 ? ' selected' : ''}>+3</option>
<option value="2"#{key==2 ? ' selected' : ''}>+2</option>
<option value="1"#{key==1 ? ' selected' : ''}>+1</option>
<option value="0"#{key==0 ? ' selected' : ''}>0</option>
<option value="-1"#{key==-1 ? ' selected' : ''}>-1</option>
<option value="-2"#{key==-2 ? ' selected' : ''}>-2</option>
<option value="-3"#{key==-3 ? ' selected' : ''}>-3</option>
<option value="-4"#{key==-4 ? ' selected' : ''}>-4</option>
<option value="-5"#{key==-5 ? ' selected' : ''}>-5</option>
</select>
<select size="1" name="symbol" onChange="this.form.submit();">
<option value="sharp"#{symbol=='sharp' ? ' selected' : ''}>♯表記</option>
<option value=""#{symbol=='' ? ' selected' : ''}>指定なし</option>
<option value="flat"#{symbol=='flat' ? ' selected' : ''}>♭表記</option>
</select>
<!-- input type="submit" value="移調" -->
</form>
#{key<0 ? '<strong>（Capo:'+(-key).to_s+'）</strong>' : (key==1 ? '<strong>（半音下げチューニング）</strong>' : (key==2 ? '<strong>（全音下げチューニング）</strong>' : ''))}<br />
速度: 
<button onclick="autoScroll(400);">1</button>
<button onclick="autoScroll(300);">2</button>
<button onclick="autoScroll(200);">3</button>
<button onclick="autoScroll(100);">4</button>
<button onclick="autoScroll(50);">5</button>
</div>

<div class="main">
#{title=="" ? "" : "<h1 class=\"title\"><!-- zenback_title_begin -->"+title+"<!-- zenback_title_begin --></h1>"}
#{subtitle=="" ? "" : "<h2 class=\"subtitle\"><!-- zenback_body_begin -->"+subtitle+"<!-- zenback_body_end --></h2>"}
<div onCopy="alert('コピーはできません。'); return false;" onCut="alert('コピーはできません。'); return false;">
#{buf}
</div>
</div>

<div id="amazon_sp">
#{itunes ? '<a href="https://itunes.apple.com/jp/album/id'+itunes+'?uo=4&at=10l8hm" target="itunes_store" style="display:inline-block;overflow:hidden;background:url(/Available_on_iTunes_Badge_JP_110x40_1004.png) no-repeat;width:110px;height:40px;"></a><br /><br />' : '<div id="its.sp"></div>'}
#{asin=='' ? '' : '<a href="https://www.amazon.co.jp/dp/'+asin+'/ref=nosim?tag=chordwiki-22" target="_blank"><img src="/img/amazonlogo.png" alt="Amazon" width="80" /><br /><img src="https://images-na.ssl-images-amazon.com/images/P/'+asin+'.09.LZZZZZZZ" alt="Product Image" width="120" /></a><br><br>'}
</div>
<div id="bottomadarea">
<!-- ChordWiki-bottom -->
<ins class="adsbygoogle"
     style="display:block;"
     data-ad-client="ca-pub-6362118305215071"
     data-ad-slot="3138022368"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
#{adult ? "" : "(adsbygoogle = window.adsbygoogle || []).push({});"}
</script>
</div>
<div id="related"></div>
#{$footer}
#{nicovideo=='' ? '' : '<!-- script async type="text/javascript" src="//query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D%22http%3A%2F%2Fext.nicovideo.jp%2Fapi%2Fgetthumbinfo%2F'+nicovideo+'%22&format=json&diagnostics=false&callback=nicothumbnail"></script -->'}
<script type="text/javascript">
  setHistory('#{t}');
  setTagHistory([#{tags.map{|tag|"'"+tag.gsub("'","\\\\'")+"'"}.join(",")}]);
  // itsJSONP.get('#{title.split(/[\(（]/)[0].to_s.delete("'　")}');
  extraAd();
</script>
<script async type="text/javascript" src="/checknote.cgi?t=#{t}"></script>
</body></html>
HTML
#{youtube=='' ? '' : '<script async type="text/javascript" src="https://www.googleapis.com/youtube/v3/videos?id='+youtube+'&key=AIzaSyC7p530dOS9Eo6i5VmyJFSCQ6MfBS_vlPE&fields=items(id,snippet(title,thumbnails(medium)))&part=snippet&callback=ytthumbnail2"></script>'}
#tags.each_with_index{|tag,i|
#  print <<EOT
#  function dic_#{i}(r){if(r[0]==1)document.getElementById('dic-#{i}').src='/img/dic.png';}
#  var s=document.createElement('script');
#  s.src='http://api.nicodic.jp/e/dic_#{i}/a/#{CGI.escape(tag.gsub(/\s/,"_"))}';
#  s.async=1;
#  document.body.appendChild(s);
#EOT
#}
#print <<EOT
#EOT
#//  searchRelated(document.getElementsByTagName('h2')[0].innerHTML.replace('<!-- zenback_body_begin -->','').replace('<!-- zenback_body_end -->','').split(/[\s:：・　]/));
#</script>
#<script type="text/javascript">
#    amzn_assoc_ad_type = "link_enhancement_widget";
#    amzn_assoc_tracking_id = "chordwiki-22";
#    amzn_assoc_linkid = "fecd5e2fd0d79c87e19e648575a38141";
#    amzn_assoc_placement = "";
#    amzn_assoc_marketplace = "amazon";
#    amzn_assoc_region = "JP";
#</script>
#<script src="//ws-fe.amazon-adsystem.com/widgets/q?ServiceVersion=20070822&Operation=GetScript&ID=OneJS&WS=1&MarketPlace=JP"></script>
#</body></html>
#EOT

end

end

$footer=<<-HTML
<div class="footer">
Copyright &copy; 2006-2026 ChordWiki. Some Rights Reserved.
</div>
HTML

#$urchin=<<EOT
#<script>
#  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
#  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
#  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
#  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
#
#  ga('create', 'UA-154593-11', 'chordwiki.org');
#  ga('send', 'pageview');
#
#</script>
#<!-- Global site tag (gtag.js) - Google Analytics -->
#<script async src="https://www.googletagmanager.com/gtag/js?id=G-V6WMEHF6XT"></script>
#<script>
#  window.dataLayer = window.dataLayer || [];
#  function gtag(){dataLayer.push(arguments);}
#  gtag('js', new Date());
#
#  gtag('config', 'G-V6WMEHF6XT');
#</script>
#$urchin=<<EOT
#<!-- Global site tag (gtag.js) - Google Analytics -->
#<script async src="https://www.googletagmanager.com/gtag/js?id=UA-154593-11"></script>
#<script>
#  window.dataLayer = window.dataLayer || [];
#  function gtag(){dataLayer.push(arguments);}
#  gtag('js', new Date());
#
#  gtag('config', 'UA-154593-11');
#</script>
#<script>
#  window.fbAsyncInit = function() {
#    FB.init({
#      appId      : '210143219012935',
#      autoLogAppEvents : true,
#      xfbml      : true,
#      version    : 'v2.10'
#    });
#    FB.AppEvents.logPageView();
#  };
#
#  (function(d, s, id){
#     var js, fjs = d.getElementsByTagName(s)[0];
#     if (d.getElementById(id)) {return;}
#     js = d.createElement(s); js.id = id;
#     js.src = "//connect.facebook.net/ja_JP/sdk.js";
#     fjs.parentNode.insertBefore(js, fjs);
#   }(document, 'script', 'facebook-jssdk'));
#</script>
#EOT
$urchin=<<-HTML
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-V6WMEHF6XT"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-V6WMEHF6XT');
</script>
HTML

cgi=CGI.new

#t=(cgi.has_key?('t') ? CGI.escape(cgi['t'].delete('./<>&"\'')) : '')
#t=(cgi.has_key?('t') ? CGI.escape(cgi['t'].delete('./<>&"\'').gsub('+','＋')) : '')
t=(cgi.has_key?('t') ? CGI.escape(cgi['t'].delete('./<>&"\'').gsub('+','＋')).gsub('~','%7E') : '')
#t=(cgi.has_key?('t') ? CGI.escape(cgi['t'].delete('./<>&"\'').gsub('+','＋')).gsub('~','%7E').gsub('#','%23') : '')
#t=(cgi.has_key?('t') ? CGI.escape(cgi['t'].delete('./<>&"\'').gsub('+','＋')).gsub('~','%7E').gsub('#','%2523') : '')
#t.gsub!('~','%7E')
#File.open("/home/worris/work/html/error.txt",'a') {|io|
#io.print t,"\n"
#}

#t=(cgi.has_key?('t') ? CGI.escape(cgi['t'].delete('./<>&"\'+')).gsub('%2B','') : '')
#t=(cgi.has_key?('t') ? CGI.escape(cgi['t'].delete('./<>&"\'')).gsub('+','%2b') : '')
#t=(cgi.has_key?('t') ? CGI.escape(cgi['t'].delete('./<>&"\'').gsub(' ','sss')).gsub('+','%2b') : '')

case cgi['c']

when ''
  print "Status: 302 Found\nLocation: /\n\n"

when 'view'
  if t==''
    print "Status: 302 Found\nLocation: /\n\n"

  elsif File.exist?('data/'+t+'.txt')
#    if ENV['HTTP_REFERER'].to_s =~ /chordwiki/
##    require 'view.rb'
#    if true #ENV['HTTP_IF_MODIFIED_SINCE'].nil? || Time.parse(ENV['HTTP_IF_MODIFIED_SINCE'].to_s)<File.mtime('data/'+t+'.txt')
      view(t,(cgi.has_key?('key') ? cgi['key'].to_i : 0),(cgi.has_key?('symbol') ? cgi['symbol'].to_s : ''))
#print "Content-type: text/html\n\n#{t}\n"
#    else
#      print "Content-type: text/html\notmodified\nn\n"
#      print "Status: 304 Not Modified\n\n"
#    end

#    require 'recommendify'
#    require 'redis'
#
#    Recommendify.redis = Redis.new
#
#    class Recommender < Recommendify::Base
#      max_neighbors 10
#      input_matrix :chordwiki,
#        :similarity_func => :jaccard,
#        :weight => 5.0
#    end
#    recommender = Recommender.new
#    recommender.chordwiki.add_set(ENV['REMOTE_ADDR'].to_s,[t])

#    else
#     frontpage()
#      frontpage()
#    end
  else
#    require './edit.rb'
#    edit(t,'',(cgi.has_key?('nochord') ? cgi['nochord'].to_i : 0),cgi['editstart'].to_i)
#    require './notfound.rb'
#    notfound(t)
    print "Status: 302 Found\nLocation: /wiki.cgi?c=find&t="+t+"\n\n"

  end

#when 'view3'
#  if t==''
##    require 'list.rb'
##    list(1,0)
#     require 'frontpage.rb'
#     frontpage()
#  elsif File.exist?('data/'+t+'.txt')
##    if ENV['HTTP_REFERER'].to_s =~ /chordwiki/
#    require 'view3.rb'
#    view(t,(cgi.has_key?('key') ? cgi['key'].to_i : 0))
##    else
##     frontpage()
##      frontpage()
##    end
#  else
#    require 'edit.rb'
#    edit(t,'',(cgi.has_key?('nochord') ? cgi['nochord'].to_i : 0))
#  end

when 'player'
  if t==''
    print "Status: 302 Found\nLocation: /\n\n"

  elsif File.exist?('data/'+t+'.txt')
    require './player.rb'
    player(t,(cgi.has_key?('key') ? cgi['key'].to_i : 0),(cgi.has_key?('symbol') ? cgi['symbol'].to_s : ''))
  end

when 'history'
  require './history.rb'
  history()
when 'source'
  if t==''
    print "Status: 302 Found\nLocation: /\n\n"
  elsif File.exist?('data/'+t+'.txt')
    require './source.rb'
    source(t)
  else
     print "Status: 302 Found\nLocation: /\n\n"
  end

when 'ranking'
  if cgi.has_key?('d')
     require './ranking.rb'
     ranking(cgi.params['d'][0])
  elsif cgi.has_key?('m')
     require './ranking2.rb'
     ranking(cgi.params['m'][0])
  else
     print "Status: 301 Moved Permanently\nLocation: /ranking.html\n\n"
  end

when 'find'
  if t==''
    print "Status: 302 Found\nLocation: /\n\n"
  else
    require './finding.rb'
    finding(t)
  end

when 'search'
  if t==''
    print "Status: 302 Found\nLocation: /\n\n"
  else
    require './finding.rb'
    finding(t)
  end

when 'edit'
    # NG list
    if ["伊藤まりかっと","ミラージュソング","あなたは醜い","路地裏猫", "Flowerwall"].include?(CGI.unescape(t))
      print "Status: 302 Found\nLocation: /\n\n"
    else
      require './edit.rb'
      edit(t,'',(cgi.has_key?('nochord') ? cgi['nochord'].to_i : 0),cgi['editstart'].to_i)
    end

when 'save'
  if cgi.has_key?('save') && (File.exist?('data/'+t+'.txt')!=true || cgi['editstart'].to_i > File.open('data/'+t+'.txt').mtime.to_i)
    require './save.rb'
    save(t,cgi['chord'],cgi['editstart'].to_i,cgi['token'])
  else
    require './edit.rb'
    edit(t,cgi['chord'],0,cgi['editstart'].to_i)
  end

when 'rating'
  if File.exist?('data/'+t+'.txt')
    require './rating.rb'
    rating(t)
  else
    print "Status: 302 Found\nLocation: /\n\n"
  end

when 'ratepost'
  if File.exist?('data/'+t+'.txt')
    require './rating.rb'
    ratepost(t,cgi['rate'].to_i,cgi['token'])
  else
    print "Status: 302 Found\nLocation: /\n\n"
  end

when 'tagedit'
  if File.exist?('data/'+t+'.txt')
    require './tag.rb'
    tagedit(t)
  else
    print "Status: 302 Found\nLocation: /\n\n"
  end

when 'tagsave'
  if File.exist?('data/'+t+'.txt')
    require './tag.rb'
    tagsave(t,cgi['tags'],cgi['token'])
  else
    print "Status: 302 Found\nLocation: /\n\n"
  end

when 'infoedit'
  if File.exist?('data/'+t+'.txt')
    require './infoedit.rb'
    infoedit(t)
  else
    print "Status: 302 Found\nLocation: /\n\n"
  end

when 'infopost'
  if File.exist?('data/'+t+'.txt')
    require './infoedit.rb'
    infopost(t,cgi['asin'],cgi['youtube'],cgi['niconico'],cgi['itunes'],cgi['jasrac'],cgi['token'])
  else
    print "Status: 302 Found\nLocation: /\n\n"
  end

when 'addlist'
  if File.exist?('data/'+t+'.txt')
    require './addlist.rb'
    addlist(t)
  else
    print "Status: 302 Found\nLocation: /\n\n"
  end

when 'savelist'
  if File.exist?('data/'+t+'.txt')
    require './addlist.rb'
    savelist(t,cgi['listid'],cgi['token'],cgi['newname'])
  else
    print "Status: 302 Found\nLocation: /\n\n"
  end

when 'editlist'
  require './editlist.rb'
  editlist(cgi['listid'].to_i)

when 'alterlist'
  require './editlist.rb'
  alterlist(cgi['listid'].to_i,cgi['token'],cgi['listname'],cgi.params['title'],cgi.params['order'],cgi.params['delete'])

when 'viewlist'
  require './viewlist.rb'
  viewlist(cgi['listid'].to_i)

when 'log'
  require './log.rb'
  log(t)

when 'logrss'
  require './logrss.rb'
  logrss(t)

when 'logview'
  require './log.rb'
  logview(t,cgi['n'],cgi['d'],(cgi.has_key?('key') ? cgi['key'].to_i : 0),(cgi.has_key?('symbol') ? cgi['symbol'].to_s : ''))

when 'srcview'
  require './log.rb'
  srcview(t,cgi['n'],cgi['d'])

when 'diff1'
  require './diff.rb'
  diff(t,cgi['orig'],cgi['new'],cgi['d'])

when 'diff'
  require './diff2.rb'
  diff2(t,cgi['orig'],cgi['new'],cgi['d'])

#when 'ls','list'
#  if cgi.has_key?('p')
#    require 'list.rb'
#    list((cgi.has_key?('p') ? cgi['p'].to_i : 1),cgi['sort'])
#  else
#     print "Status: 301 Moved Permanently\nLocation: /list.html\n\n"
#  end

when 'deleted'
  require './deleted.rb'
  deleted((cgi.has_key?('p') ? cgi['p'].to_i : 1),cgi['sort'])

#when 'search'
#  if t==''
#    require 'list.rb'
#    list(1,0)
#  else
#    require 'search.rb'
#    search(t,(cgi.has_key?('p') ? cgi['p'].to_i : 1))
#  end

when 'note'
  require './note.rb'
  note(t,(cgi.has_key?('l') ? cgi['l'] : ""))

when 'noterss'
  require './noterss.rb'
  noterss(t)

when 'write'
  require './write.rb'
  write(t,cgi['from'],cgi['mail'],cgi['message'],cgi['token'])

else
  print "Status: 302 Found\nLocation: /\n\n"
end # of case

#<li><g:plusone size="medium"></g:plusone></li>
#<li><a href="https://twitter.com/share" class="twitter-share-button" data-lang="ja" data-related="chordwiki">ツイート</a>
#<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script></li>
#<li><script src="http://connect.facebook.net/ja_JP/all.js#xfbml=1"></script><fb:like send="false" layout="button_count" width="120" show_faces="false"></fb:like></li>
#<li><a data-pocket-label="pocket" data-pocket-count="horizontal" class="pocket-btn" data-lang="en"></a>
#<script type="text/javascript">!function(d,i){if(!d.getElementById(i)){var j=d.createElement("script");j.id=i;j.src="https://widgets.getpocket.com/v1/j/btn.js?v=1";var w=d.getElementById(i);d.body.appendChild(j);}}(document,"pocket-btn-js");</script></li>
#<li><a href="http://b.hatena.ne.jp/entry/http://ja.chordwiki.org/wiki/#{t}" class="hatena-bookmark-button" data-hatena-bookmark-layout="standard" title="このエントリーをはてなブックマークに追加"><img src="http://b.st-hatena.com/images/entry-button/button-only.gif" alt="このエントリーをはてなブックマークに追加" width="20" height="20" style="border: none;" /></a><script type="text/javascript" src="http://b.st-hatena.com/js/bookmark_button.js" charset="utf-8" async="async"></script></li>
#<li id="linebutton"><a href="http://line.naver.jp/R/msg/text/?#{CGI.escape((title=="" ? "" : title)+(subtitle=="" ? "" : " （"+subtitle+"）")+" - ChordWiki")}%0D%0Ahttp://ja.chordwiki.org/wiki/#{CGI.escape(t)}" onClick="_gaq.push(['_trackSocial', 'LINE', 'Send', 'http://ja.chordwiki.org/wiki/#{t}']);"><img src="/linebutton_88x20.png" alt="LINEで送る" width="88" height="20" style="border: none;" /></a></li>
