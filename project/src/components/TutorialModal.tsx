
import { Tutorial } from '../types/Tutorial';

interface TutorialModalProps {
  tutorial: Tutorial;
  onClose: () => void;
}

export default function TutorialModal({ tutorial, onClose }: TutorialModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#2A0A3E] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{tutorial.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Fechar modal"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {tutorial.content.steps && (
              <div className="space-y-4">
                {tutorial.content.steps.map((step, index) => (
                  <div key={index} className="card hover:scale-100">
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-gray-300 whitespace-pre-line">{step.description}</p>
                  </div>
                ))}
              </div>
            )}

            {tutorial.content.video && (
              <div className="aspect-video rounded-xl overflow-hidden">
                <iframe
                  src={tutorial.content.video}
                  title={tutorial.title}
                  className="w-full h-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {tutorial.content.links && (
              <div className="flex flex-wrap gap-4">
                {tutorial.content.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    className="btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                  >
                    {link.text}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}