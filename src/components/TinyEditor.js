import React from 'react';
import { Editor } from '@tinymce/tinymce-react';
import useFetch from 'use-http';

const TinyEditor = ({ initConf, value, onChange, ...others }) => {

  const { post: fileUpload, response: fileUploadRes } = useFetch(
    '/api/files/',
    options => {
      delete options.headers['Content-Type'];
      return options;
    }
  );

  const imageUploadHandler = async (blobInfo, success, failure) => {
    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());
    const result = await fileUpload(formData);
    if (fileUploadRes.ok) success(result.file);
    else failure('HTTP Error: ' + fileUploadRes.status);
  };

  return (
    <Editor
      onEditorChange={(content, editor) => {
        if(onChange) onChange(content);
      }}
      value={value}
      init={{
        height: 500,
        menubar: false,
        plugins: [
          'advlist autolink lists link image charmap print preview anchor',
          'searchreplace visualblocks code fullscreen',
          'insertdatetime media table paste code help wordcount'
        ],
        toolbar:
          'undo redo | formatselect | bold italic backcolor | \
        alignleft aligncenter alignright alignjustify | \
        bullist numlist outdent indent | removeformat | link image | help',
        selector: 'textarea',
        file_browser_callback_types: 'file image media',
        file_picker_types: 'file image media',
        relative_urls: false,
        remove_script_host: false,
        images_upload_handler: imageUploadHandler,
        ...initConf
      }}
      {...others}
    />
  );
};

export default TinyEditor;
