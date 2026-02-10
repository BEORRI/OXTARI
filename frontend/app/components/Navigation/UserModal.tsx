"use client";

import React from "react";

interface UserModalComponentProps {
  modal_id: string;
  title: string;
  text: string;
  triggerAccept?: null | ((a: any) => void);
  triggerValue?: any | null;
  triggerString?: string | null;
}

import BEORRIButton from "./BEORRIButton";

const UserModalComponent: React.FC<UserModalComponentProps> = ({
  title,
  modal_id,
  text,
  triggerAccept,
  triggerString,
  triggerValue,
}) => {
  return (
    <dialog id={modal_id} className="modal modal-bottom sm:modal-middle">
      <div className="modal-box max-w-lg bg-white border-2 border-gray-200 shadow-2xl rounded-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 flex items-center justify-between border-b-2 border-red-400">
          <h3 className="font-bold text-xl">{title}</h3>
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost hover:bg-red-700 text-white">
              ✕
            </button>
          </form>
        </div>
        
        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
            {text}
          </p>
        </div>
        
        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-200 flex gap-3 justify-end">
          <form method="dialog" className="flex gap-3">
            <BEORRIButton
              type="submit"
              title="Cancel"
              variant="secondary"
            />
            {triggerAccept && triggerString && (
              <BEORRIButton
                type="submit"
                title={triggerString}
                selected_color="bg-gradient-to-r from-red-500 to-red-600"
                selected_text_color="text-white"
                selected={true}
                onClick={() => {
                  triggerAccept(triggerValue);
                }}
              />
            )}
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export default UserModalComponent;
