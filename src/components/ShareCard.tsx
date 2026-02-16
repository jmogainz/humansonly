'use client';

type ShareCardProps = {
  title: string;
  scoreText: string;
};

export default function ShareCard({ title, scoreText }: ShareCardProps) {
  return (
    <button
      type="button"
      className="button buttonGhost"
      onClick={async () => {
        const text = `${title}\n${scoreText}\nhttps://humansonly.io`;
        if (navigator.share) {
          await navigator.share({ text, title: 'HumansOnly' });
          return;
        }
        await navigator.clipboard.writeText(text);
      }}
    >
      Share
    </button>
  );
}
